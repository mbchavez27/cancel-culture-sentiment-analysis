"""Pseudonymize commenter identities across raw data, derived CSVs, and notebook outputs.

Run once before public release, from the repository root:

    uv run python scripts/pseudonymize.py

What it does
------------
* Replaces every YouTube commenter channel ID with ``user_NNNNNN`` and every comment ID
  with ``cmt_NNNNNN``. Pseudonyms are assigned by the *rank of the original ID in sorted
  order*, so every sort, groupby, and graph node-insertion order in the pipeline is
  unchanged. This matters because Louvain community detection is node-order sensitive:
  random hashes shift modularity by ~0.002 and community counts by ~3, whereas
  order-preserving pseudonyms reproduce the published network metrics exactly.
* Replaces the ``author`` display handle with the commenter's ``user_NNNNNN`` pseudonym
  and drops ``author_url`` / ``author_thumbnail``.
* Replaces ``@handle`` mentions inside comment text with a one-to-one placeholder:
  ``@user_NNNNNN`` when the handle belongs to a commenter in the dataset, otherwise
  ``@mention_NNNNNN``. The mapping is injective, so preprocessing deduplication (which
  compares cleaned text) keeps exactly the same comments as on the original data; a
  generic ``@user`` mask would merge distinct comments and drop 40 extra rows.
* Removes signed media/stream URLs from raw yt-dlp metadata (they embed the collector's
  IP address) and redacts any remaining ``ip=`` URL parameters.
* Applies the same mapping to text in saved notebook outputs and strips the absolute
  home-directory path of the machine the notebooks were executed on.

The script is idempotent: re-running it on already pseudonymized data is a no-op,
because ranks of ``user_NNNNNN`` / ``cmt_NNNNNN`` IDs equal their own numbers and
placeholder mentions are left as they are.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections.abc import Callable, Iterable
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"
CASES: tuple[str, ...] = ("bodeoum_tv", "mimiminu")

USER_PREFIX = "user_"
COMMENT_PREFIX = "cmt_"
MENTION_PREFIX = "@mention_"
MASKED_MENTION = "@user"
PLACEHOLDER_RE = re.compile(r"^@(?:user|mention)_\d+$")

# Raw yt-dlp keys holding signed, expiring media URLs; never read by the pipeline
MEDIA_KEYS: frozenset[str] = frozenset(
    {"formats", "requested_formats", "requested_downloads", "url", "manifest_url", "fragments"}
)
COMMENTER_DROP_KEYS: tuple[str, ...] = ("author_url", "author_thumbnail")

# A mention starts at '@' not preceded by a word char (so e-mail addresses are untouched)
MENTION_RE = re.compile(r"(?<![\w.@])@[\w.\-]+")
IP_PARAM_RE = re.compile(r"([?&/])ip([=/])(?!0\.0\.0\.0)[0-9A-Fa-f.:%]+")
CHANNEL_ID_RE = re.compile(r"\bUC[A-Za-z0-9_-]{22}\b")
COMMENT_ID_RE = re.compile(r"\bUg[A-Za-z0-9_-]{18,}(?:\.[A-Za-z0-9_-]+)?")
HOME_PATH_RE = re.compile(r"/(?:home|Users)/[^/\s\"']+/[^\s\"']*?(?=cancel-culture-sentiment-analysis)")

CSV_ID_COLUMNS: dict[str, str] = {
    "comment_id": "comment",
    "parent_id": "comment",
    "source_comment_id": "comment",
    "target_comment_id": "comment",
    "author_id": "user",
    "node": "user",
}
CSV_TEXT_COLUMNS: tuple[str, ...] = ("text", "text_clean")


def raw_comment_files() -> list[Path]:
    """Return every raw per-video comment dump, in a stable order."""
    return sorted(DATA_DIR.glob("*/comments/*.info.json"))


def build_rank_map(values: Iterable[str], prefix: str) -> dict[str, str]:
    """
    Map each distinct value to ``prefix + zero-padded rank`` in sorted order.

    Args:
        values: Original identifiers (duplicates allowed).
        prefix: Pseudonym prefix, e.g. ``user_``.

    Returns:
        Order-preserving mapping from original identifier to pseudonym.
    """
    ordered = sorted(set(values))
    width = max(6, len(str(len(ordered))))
    return {value: f"{prefix}{rank:0{width}d}" for rank, value in enumerate(ordered, start=1)}


def collect_mappings() -> tuple[dict[str, str], dict[str, str], dict[str, str]]:
    """
    Build user, comment, and mention mappings from the raw comment dumps.

    Returns:
        (user_map, comment_map, mention_map). ``mention_map`` is injective: a mention of a
        commenter whose handle and channel correspond one-to-one maps to ``@user_NNNNNN``;
        every other distinct mention token maps to its own ``@mention_NNNNNN``.
    """
    user_ids: set[str] = set()
    comment_ids: set[str] = set()
    handle_owners: dict[str, set[str]] = {}
    owner_handles: dict[str, set[str]] = {}
    mention_tokens: set[str] = set()
    for path in raw_comment_files():
        for comment in json.loads(path.read_text(encoding="utf-8")).get("comments", []):
            comment_ids.add(comment["id"])
            if comment.get("parent") not in (None, "root"):
                comment_ids.add(comment["parent"])
            author_id, handle = comment.get("author_id"), comment.get("author")
            if author_id:
                user_ids.add(author_id)
                if handle:
                    handle_owners.setdefault(handle, set()).add(author_id)
                    owner_handles.setdefault(author_id, set()).add(handle)
            if isinstance(comment.get("text"), str):
                mention_tokens.update(MENTION_RE.findall(comment["text"]))

    user_map = build_rank_map(user_ids, USER_PREFIX)
    comment_map = build_rank_map(comment_ids, COMMENT_PREFIX)

    # Handles usable as user pseudonyms: one handle <-> one channel, keeps the map injective
    handle_to_user = {
        handle: "@" + user_map[next(iter(owners))]
        for handle, owners in handle_owners.items()
        if len(owners) == 1 and len(owner_handles[next(iter(owners))]) == 1
    }
    tokens = {t for t in mention_tokens if not PLACEHOLDER_RE.match(t)}
    other = build_rank_map((t for t in tokens if t not in handle_to_user), MENTION_PREFIX)
    mention_map = {t: handle_to_user.get(t) or other[t] for t in tokens}
    return user_map, comment_map, mention_map


def mask_mentions(text: str, mentions: dict[str, str]) -> str:
    """Replace every ``@handle`` mention with its placeholder (generic if unmapped)."""
    return MENTION_RE.sub(lambda m: mentions.get(m.group(0), m.group(0) if PLACEHOLDER_RE.match(m.group(0)) else MASKED_MENTION), text)


def strip_media(node: Any) -> Any:
    """Recursively drop signed media-URL keys from a yt-dlp metadata object."""
    if isinstance(node, dict):
        return {k: strip_media(v) for k, v in node.items() if k not in MEDIA_KEYS}
    if isinstance(node, list):
        return [strip_media(v) for v in node]
    return node


def redact_ip(serialized: str) -> str:
    """Redact non-placeholder ``ip=`` parameters left in any URL."""
    return IP_PARAM_RE.sub(r"\1ip\2REDACTED", serialized)


def pseudonymize_comment(
    comment: dict[str, Any], users: dict[str, str], comments: dict[str, str], mentions: dict[str, str]
) -> dict[str, Any]:
    """Return a copy of one raw comment record with identities replaced."""
    out = {k: v for k, v in comment.items() if k not in COMMENTER_DROP_KEYS}
    out["id"] = comments.get(comment["id"], comment["id"])
    if comment.get("parent") not in (None, "root"):
        out["parent"] = comments.get(comment["parent"], comment["parent"])
    if comment.get("author_id"):
        out["author_id"] = users.get(comment["author_id"], comment["author_id"])
        out["author"] = out["author_id"]
    if isinstance(comment.get("text"), str):
        out["text"] = mask_mentions(comment["text"], mentions)
    return out


def process_raw_comment_file(
    path: Path, users: dict[str, str], comments: dict[str, str], mentions: dict[str, str]
) -> None:
    """Pseudonymize commenters and strip media URLs in one ``*.info.json`` file."""
    payload = strip_media(json.loads(path.read_text(encoding="utf-8")))
    payload["comments"] = [pseudonymize_comment(c, users, comments, mentions) for c in payload.get("comments", [])]
    path.write_text(redact_ip(json.dumps(payload, ensure_ascii=False)), encoding="utf-8")


def process_raw_jsonl(path: Path) -> None:
    """Strip media URLs from a collection JSONL (video records only carry public metadata)."""
    lines = path.read_text(encoding="utf-8").splitlines()
    cleaned = [json.dumps(strip_media(json.loads(line)), ensure_ascii=False) for line in lines if line.strip()]
    path.write_text(redact_ip("\n".join(cleaned) + "\n"), encoding="utf-8")


def process_csv(path: Path, users: dict[str, str], comments: dict[str, str], mentions: dict[str, str]) -> bool:
    """
    Rewrite identity and text columns of a derived CSV in place, preserving all other bytes.

    Returns:
        True if the file contained any identity or text column.
    """
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)
    touched = [c for c in fieldnames if c in CSV_ID_COLUMNS or c in CSV_TEXT_COLUMNS or c == "author"]
    if not touched:
        return False

    lookups = {"user": users, "comment": comments}
    for row in rows:
        for col in touched:
            value = row[col]
            if col in CSV_ID_COLUMNS and value:
                row[col] = lookups[CSV_ID_COLUMNS[col]].get(value, value)
            elif col in CSV_TEXT_COLUMNS and value:
                row[col] = mask_mentions(value, mentions)
        if "author" in row and "author_id" in row:
            row["author"] = row["author_id"]

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    return True


def make_output_scrubber(users: dict[str, str], comments: dict[str, str], mentions: dict[str, str]) -> Callable[[str], str]:
    """Build a function that scrubs identities and local paths from notebook output text."""

    def scrub(text: str) -> str:
        text = HOME_PATH_RE.sub("", text)
        text = CHANNEL_ID_RE.sub(lambda m: users.get(m.group(0), m.group(0)), text)
        text = COMMENT_ID_RE.sub(lambda m: comments.get(m.group(0), m.group(0)), text)
        return mask_mentions(text, mentions)

    return scrub


def scrub_value(value: Any, scrub: Callable[[str], str]) -> Any:
    """Apply ``scrub`` to a notebook output field (string or list of strings)."""
    if isinstance(value, str):
        return scrub(value)
    if isinstance(value, list):
        return [scrub(v) if isinstance(v, str) else v for v in value]
    return value


def process_notebook(path: Path, scrub: Callable[[str], str]) -> None:
    """Scrub text-like outputs of every code cell; images are left untouched."""
    nb = json.loads(path.read_text(encoding="utf-8"))
    for cell in nb.get("cells", []):
        for output in cell.get("outputs", []):
            if "text" in output:
                output["text"] = scrub_value(output["text"], scrub)
            for mime, value in output.get("data", {}).items():
                if mime.startswith("text/"):
                    output["data"][mime] = scrub_value(value, scrub)
            if "traceback" in output:
                output["traceback"] = scrub_value(output["traceback"], scrub)
    path.write_text(json.dumps(nb, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def main() -> int:
    """Pseudonymize the whole repository in place."""
    users, comments, mentions = collect_mappings()
    print(f"Mapping {len(users):,} commenters and {len(comments):,} comments")

    for path in raw_comment_files():
        process_raw_comment_file(path, users, comments, mentions)
    for case in CASES:
        process_raw_jsonl(DATA_DIR / case / f"{case}_youtube.jsonl")
    print("Raw data: done")

    csv_paths = sorted(p for stage in ("02-preprocessing", "03-analysis", "04-evaluation")
                       for p in (REPO_ROOT / stage / "outputs").rglob("*.csv"))
    rewritten = [p for p in csv_paths if process_csv(p, users, comments, mentions)]
    print(f"Derived CSVs rewritten: {len(rewritten)}")

    scrub = make_output_scrubber(users, comments, mentions)
    notebooks = sorted(REPO_ROOT.glob("0[1-4]-*/notebooks/*.ipynb"))
    for path in notebooks:
        process_notebook(path, scrub)
    print(f"Notebook outputs scrubbed: {len(notebooks)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
