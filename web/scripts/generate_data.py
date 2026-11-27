#!/usr/bin/env python3
"""Build the curated site dataset from the repository's analysis outputs.

The website is static, but its numbers should remain auditable. This script
reads the CSVs/JSON produced by the pipeline and writes a single JSON file
consumed by the React app. It uses only the Python standard library.

Usage (from web/):
    python3 scripts/generate_data.py
"""

from __future__ import annotations

import csv
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parents[1] / "src" / "data" / "cases.json"

CASE_DIRS = {
    "bodeoum_tv": ROOT / "03-analysis" / "outputs" / "bodeoum_tv",
    "mimiminu": ROOT / "03-analysis" / "outputs" / "mimiminu",
}

CASE_META = {
    "bodeoum_tv": {
        "name": "Bodeoum TV",
        "person": "Kang Hyung-wook",
        "handle": "@Bodeumofficial",
        "role": "Dog trainer · TV personality",
        "short": "Bodeoum",
        "accent": "oxide",
        "trigger": "Covert workplace surveillance allegations",
        "triggerDetail": (
            "Former employees alleged covert monitoring of staff. Kang issued "
            "a 55-minute procedural apology and was later cleared of criminal "
            "intent."
        ),
        "outcome": (
            "Prosecutors later cleared him of criminal intent. The study's "
            "post-apology window begins on July 6, 2024."
        ),
        "apologyTitleEn": "I'm sorry it took so long.",
        "opening": "A workplace-surveillance scandal",
        "raw": 129_429,
        "empty": 55,
        "duplicates": 842,
        "labelCounts": {"POSITIVE": 65_506, "NEGATIVE": 46_404, "NEUTRAL": 16_622},
        "replyLinks": {"pre": 6_141, "cancel": 34_959, "post": 1_640},
        "threadRoot": "Ugwo3w6aE2-s1kqFXHN4AaABAg",
        "transcriptTranslation": (
            "Hello. I'm trainer Kang Hyung-wook. Before asking whether the "
            "allegations are true, I'm truly sorry for making noise with this news "
            "and for bringing you such bad news. I'm someone who should be talking "
            "about how to live better with dogs, but I'm sorry for showing you a bad "
            "side through actions that fell short."
        ),
        "transcriptNote": (
            "The local Whisper transcript mishears “강형욱” as “강영웅” in its "
            "first line. Transcripts were collected but not analyzed in the paper."
        ),
    },
    "mimiminu": {
        "name": "Mimiminu",
        "person": "Kim Min-woo",
        "handle": "@mimiminu_official",
        "role": "Education creator · former teacher",
        "short": "Mimiminu",
        "accent": "slate",
        "trigger": "Promoted app filed for bankruptcy, trapping student deposits",
        "triggerDetail": (
            "Part-time Study, an educational app Miminu promoted, filed for "
            "bankruptcy, affecting student deposits. He returned his "
            "100-million KRW advertising fee and contributed an additional "
            "amount to a victim fund."
        ),
        "outcome": (
            "He continued publishing after the apology. Post-window sentiment "
            "stayed above its pre-window level."
        ),
        "apologyTitleEn": "I'm sorry for the Part-time Study bankruptcy and deposit delays.",
        "opening": "A financial scandal with student victims",
        "raw": 16_794,
        "empty": 3,
        "duplicates": 43,
        "labelCounts": {"POSITIVE": 9_873, "NEGATIVE": 4_309, "NEUTRAL": 2_566},
        "replyLinks": {"pre": 4_208, "cancel": 800, "post": 2_102},
        "threadRoot": "Ugwx5jli6eEzYZUNt7x4AaABAg",
        "transcriptTranslation": (
            "Hello. I'm Miminu. On Monday, November 24, the Part-time Study "
            "service I advertised on this channel filed for bankruptcy without "
            "warning, and many people have been unable to get their deposits back. "
            "I turned on the camera to explain my position and what I plan to do. "
            "Put simply, I will formally return the entire advertising fee I "
            "received, plus an additional amount, to the victims—and I will try to "
            "help those who are losing sleep and suffering right now as they face a "
            "difficult fight ahead."
        ),
        "transcriptNote": (
            "Collected with faster-whisper, locally. The paper uses transcripts as "
            "context; it does not run a linguistic analysis of the apology videos."
        ),
    },
}

TITLE_TRANSLATIONS = {
    "bodeoum_tv": {
        "pre-10": "The breed even Kang Hyung-wook finds hard to raise (not for beginners) · Malinois",
        "pre-9": "Training two Shiba Inus with double the cuteness · Puppy Training",
        "pre-8": "Celebrity sisters TWICE’s Jeongyeon and Gong Seung-yeon come to brag about their dogs · Guest Show EP.27",
        "pre-7": "So cute it gives you a nosebleed (the editor’s third) · Bernese Mountain Dog",
        "pre-6": "This puppy is mine now: the pretty puppy Kang Hyung-wook fell for · Puppy Training",
        "pre-5": "Uhm Jung-hwa, how did you raise them? Kang Hyung-wook falls for a Jindo · Guest Show EP.28",
        "pre-4": "The breed that traumatized Kang Hyung-wook · Wire Fox Terrier",
        "pre-3": "How a rescue dog learns to go for a walk · Let’s Go Home EP.7",
        "pre-2": "The dog whose tongue turns purple when it bleats · Chow Chow",
        "pre-1": "A small dog freezes in front of a big dog... (the big dog is Kang Hyung-wook) · Puppy Training",
        "cancel-1": "I’m sorry it took so long.",
        "post-1": "A bright-eyed dog I haven’t seen in a while · Puppy Training",
        "post-2": "“Shoo, devil” — the Doberman that needs early training · Doberman Pinscher",
        "post-3": "Hae-on showing off her flower-like beauty · Let’s Go Home EP.8",
        "post-4": "Why Spitzes are such sensitive bosses · Spitz",
        "post-5": "Training a happy-go-lucky dog that walks with a bounce · Puppy Training",
        "post-6": "Looking for the ball the entire video · Bedlington Terrier",
        "post-7": "10-year-old Hodong, who was quite a handful back in the day · Let’s Go Home EP.9",
        "post-8": "You’ve got chocolate on your mouth. I fell for the cute Choco. · Puppy Training",
        "post-9": "The “that dog” everyone has seen at least once at the mart · West Highland White Terrier",
        "post-10": "“I’m scared of plastic bags” — training a fearful puppy · Puppy Training",
    },
    "mimiminu": {
        "pre-10": "“TEAM08, are you ready?” Meeting ILLIT on the set of a Megapass ad for the 2027 CSAT",
        "pre-9": "[5BS] Kim Min-woo — Farewellcome 2026 ver.",
        "pre-8": "“How can I watch the Worlds final four days before the CSAT?” Congratulations to T1 on the three-peat",
        "pre-7": "“Students came up and asked for photos” — Health Study 3 students share their 2026 CSAT stories",
        "pre-6": "“29 in Korean History? 79 in English? Ha...” Health Study 3 students’ 2026 CSAT grading livestream",
        "pre-5": "“Why is reading so much harder than in mock exams?” Reviewing the brutal 2026 CSAT Korean section",
        "pre-4": "“No killer questions? Forget it—the killers are back.” Reviewing the 2026 CSAT math section",
        "pre-3": "“I trusted the guessing lecture and bombed” — reviewing the cruel 2026 CSAT English section",
        "pre-2": "“Gachon University hosts a waterbomb” — grading college students’ GPAs at Gachon · GPA Reader EP.27",
        "pre-1": "“Do you snoop on students’ Instagram?” Teachers from Seoul National, Korea, and Yonsei universities compete",
        "cancel-1": "I’m sorry for the Part-time Study bankruptcy and delayed deposit refunds.",
        "post-1": "“TEAM08, are you really ready now?” Analyzing the 2027 CSAT online-course passes",
        "post-2": "“The calculus challenge from a foreigner!” How good are Hyundai researchers at math? · Street Math Challenge EP.15",
        "post-3": "“Are you really doing this in front of the CEO..?” Final pitch at Board Game Cafe Red Button HQ · Mimimi Life EP.28",
        "post-4": "“Sophomore fall is where your school record is won” — a freshman worried about her record after quitting sports · All About Admissions EP.104",
        "post-5": "“High-school math and university math are completely different” · Department Profiles 14: Mathematics",
        "post-6": "“I have no plans to lecture in the private online-course market” — EBS Korean instructor Yun Hye-jeong joins",
        "post-7": "“Success and happiness are separate questions” — Yoon Do-young’s sharp advice on admissions and life · All About Admissions EP.105",
        "post-8": "[CSAT Math Roundtable] “If the exam changes, instructors work less” with Kim Seong-eun, Jeong Byeong-ho, Kang Yun-gu, and Math Rangu",
        "post-9": "“People keep giving birth to me (?)” — a Yonsei law graduate YouTuber who opened the new-media era · New Number’s God EP.74",
        "post-10": "“There’s no telling when the regular admissions cycle ends” — a sophomore hoping for regular admissions · All About Admissions EP.106",
    },
}

THREAD_TRANSLATIONS = {
    # Bodeoum — a star-shaped argument about the surveillance allegations.
    "Ugwo3w6aE2-s1kqFXHN4AaABAg": (
        "Stop the witch hunt. Make those employees show their faces and sue them "
        "for false accusation. Are they trying to destroy someone again just "
        "because they're upset? Stay strong, Kang Hyung-wook."
    ),
    "Ugwo3w6aE2-s1kqFXHN4AaABAg.A3pEc2Oo0hTA3pFVsrE_T3": (
        "Yes—sue quickly and let the truth come out. No more arguing or tearing "
        "people down in the comment-section court."
    ),
    "Ugwo3w6aE2-s1kqFXHN4AaABAg.A3pEc2Oo0hTA3qm8HfJtB7": (
        "They can't sue for false accusation. It's true that he looked through the "
        "messenger. If that were false, it would be false accusation—but it's fact, "
        "so it isn't."
    ),
    "Ugwo3w6aE2-s1kqFXHN4AaABAg.A3pEc2Oo0hTA3pFsSSE2-N": (
        "It isn't false accusation. The couple were partly at fault, the employee "
        "overreacted, and there are misunderstandings on both sides."
    ),
    "Ugwo3w6aE2-s1kqFXHN4AaABAg.A3pEc2Oo0hTA3pRjLAzn1R": (
        "You should clear up the misunderstanding—why play the media game? You "
        "don't even have the guts to show your face, so let's dig up identities; "
        "they'll only learn after hitting rock bottom."
    ),
    # Mimiminu — a branching debate about who should pay.
    "Ugwx5jli6eEzYZUNt7x4AaABAg": (
        "Why is the model doing the compensation the perpetrator should do? I hope "
        "this doesn't make the perpetrator's responsibility lighter."
    ),
    "Ugwx5jli6eEzYZUNt7x4AaABAg.APwa9Zg9PWKAQQYTuzBZSv": (
        "Right—isn't he just a model? He doesn't even seem to be a shareholder. "
        "Why is he apologizing and compensating? lol"
    ),
    "Ugwx5jli6eEzYZUNt7x4AaABAg.APwa9Zg9PWKAQczlxZl5sK": (
        "Because his image is taking a big hit, he's doing this to reduce the "
        "damage as much as he can."
    ),
    "Ugwx5jli6eEzYZUNt7x4AaABAg.APwa9Zg9PWKARQnbAdNBo6": (
        "He wasn't just a model—he was acting as an agency."
    ),
    "Ugwx5jli6eEzYZUNt7x4AaABAg.APwa9Zg9PWKARkpwhtiSxH": (
        "This is exactly why he has no choice. Once a few people like you—and "
        "others who join just for fun—pile on, how much muddying of the waters "
        "will there be?"
    ),
}

SENTIMENT_TRANSLATIONS = {
    "힘드셨을텐데 잘하셨어요": "You must have had a hard time; you did well.",
    "전문경영이 안되서 생긴거같은데? 사업자로 계약한것도 고용하기 싫어서 그런거같고": (
        "Seems like this happened because there's no professional management? "
        "And I think they used contractor agreements because they didn't want to "
        "hire employees."
    ),
    "이게 사실이면 진짜 악질 나르시시스트네": (
        "If this is true, he's a real malicious narcissist."
    ),
    "다시 와주셔서 감사합니다❤🎉": "Thank you for coming back ❤🎉",
    "뒤처리 고트네.. 롱런하는 이유가 있어~ 응원해 형": (
        "The way you handle the aftermath is GOAT-level. There's a reason you last "
        "so long. Rooting for you, bro."
    ),
    "쓰레기 업체 때문에 대미누 돈 깨지누...": (
        "Because of a trash company, Miminu is losing money..."
    ),
    "진짜 이건 자연재해네...ㅠㅠ": "This is a natural disaster, honestly... ㅠㅠ",
    "미누님 항상 응원합니다\n다사다난한 한해였지만 그 자체로도 미누님은 대체 불가능한 존재입니다! 이미 많은 한계들을 넘으셨기에 앞으로 그 한계를 넘는게 점점 힘들고 어려울거 깉아요ㅠㅠ 앞으로도 항상 응원합니다": (
        "Always rooting for you, Miminu. It's been a turbulent year, but you're "
        "irreplaceable in your own right. You've already crossed so many limits "
        "that the next ones will be even harder—but I'll always root for you."
    ),
}

SENTIMENT_NOTES = {
    "힘드셨을텐데 잘하셨어요": "A short, unambiguous message of support.",
    "전문경영이 안되서 생긴거같은데? 사업자로 계약한것도 고용하기 싫어서 그런거같고": (
        "Critical of management choices; the model reads the criticism as negative."
    ),
    "이게 사실이면 진짜 악질 나르시시스트네": (
        "The words are harsh, but the model's confidence falls inside the 0.4–0.6 "
        "band, so the final label is NEUTRAL. This is the band doing its job—and "
        "also a reminder that NEUTRAL is not a semantic third class."
    ),
    "다시 와주셔서 감사합니다❤🎉": "Post-apology warmth; emoji survive cleaning.",
    "뒤처리 고트네.. 롱런하는 이유가 있어~ 응원해 형": (
        "Praise for how he handled the fallout, not for the controversy itself."
    ),
    "쓰레기 업체 때문에 대미누 돈 깨지누...": (
        "The negative language is aimed at the company, not Miminu. The model "
        "scores the surface polarity, not the target of blame."
    ),
    "진짜 이건 자연재해네...ㅠㅠ": (
        "Sympathy mixed with resignation. The confidence lands just above 0.5, "
        "inside the NEUTRAL band."
    ),
    "미누님 항상 응원합니다\n다사다난한 한해였지만 그 자체로도 미누님은 대체 불가능한 존재입니다! 이미 많은 한계들을 넘으셨기에 앞으로 그 한계를 넘는게 점점 힘들고 어려울거 깉아요ㅠㅠ 앞으로도 항상 응원합니다": (
        "A long-term viewer message. Length does not change the label, but the "
        "model reads the closing support clearly."
    ),
}

CLEANING_SPECS = {
    "bodeoum_tv": [
        {
            "label": "A promo comment with a URL",
            "needle": "🐕 댓글 이벤트",
            "translation": (
                "🐕 Comment event 🐕 Tell us what you thought of the Bernese Mountain "
                "Dog breed guide. We'll draw two people who leave fun, useful comments "
                "and send them a Foretail vest + dog coat! *Foretail product info: "
                "[link]"
            ),
            "operations": ["Remove URLs", "Collapse whitespace"],
            "note": "The link disappears; the emoji, punctuation, and promotional text stay.",
        },
        {
            "label": "A comment written with line breaks",
            "needle": "마음이  너무  아픕니다",
            "translation": (
                "My heart aches so much. Don't give up. The truth will come out. "
                "Stay strong—I'm rooting for you."
            ),
            "operations": ["Collapse whitespace", "Normalize spacing"],
            "note": "Line breaks and repeated spaces become single spaces.",
        },
    ],
    "mimiminu": [
        {
            "label": "A promo comment with a URL",
            "needle": "에듀플렉스 윈터스쿨",
            "translation": (
                "🚀 I'll move up to the top ranks this vacation with Eduplex Winter "
                "School! [link]"
            ),
            "operations": ["Remove URLs", "Collapse whitespace"],
            "note": "Carriage returns and the tracking URL are removed; the emoji remains.",
        },
        {
            "label": "A comment written with line breaks",
            "needle": "미리 기받아가 08들",
            "translation": (
                "Taking the good vibes in advance, class of '08 😊😊😊 A 2001-born "
                "passerby: Korean 100, Math 96, English 100, Ethics 50, Life & "
                "Ethics 48."
            ),
            "operations": ["Collapse whitespace", "Keep emoji"],
            "note": "Score lines are joined; emoji and punctuation are preserved.",
        },
    ],
}

DEDUP_SPECS = {
    "bodeoum_tv": {
        "label": "The same reply, posted twice",
        "needle": "저기서 갑질이 뭐가있냐?",
        "slot": "cancel-1",
    },
    "mimiminu": {
        "label": "The same reply, posted twice",
        "needle": "고마워 😊",
        "slot": "post-8",
    },
}


def read_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def num(value, default=0.0) -> float:
    if value in (None, ""):
        return default
    return float(value)


def window_key(slot: str) -> str:
    return slot.split("-")[0]


def slot_number(slot: str) -> int:
    return int(slot.split("-")[1])


def duration_clock(seconds: int) -> str:
    minutes, sec = divmod(int(seconds), 60)
    return f"{minutes}:{sec:02d}"


def clean_math(value: float, digits: int = 1) -> float:
    return round(value, digits)


def main() -> None:
    spans = {
        (row["case"], row["window"]): row
        for row in read_csv(ROOT / "02-preprocessing" / "outputs" / "window_spans.csv")
    }

    sentiment_windows = {}
    sentiment_slots = {}
    network_slots = {}
    network_windows = {}
    amplifications = {}
    videos = {}
    slots = {}
    recovery = {}

    for case, case_dir in CASE_DIRS.items():
        sentiment_windows[case] = {
            row["window"]: row
            for row in read_csv(case_dir / "sentiment_by_window.csv")
        }
        sentiment_slots[case] = {
            row["slot"]: row for row in read_csv(case_dir / "sentiment_by_slot.csv")
        }
        network_slots[case] = {
            row["name"]: row for row in read_csv(case_dir / "network_by_slot.csv")
        }
        network_windows[case] = {
            row["name"]: row for row in read_csv(case_dir / "network_by_window.csv")
        }
        amplifications[case] = {
            row["metric"]: float(row["value"])
            for row in read_csv(case_dir / "network_structure_analysis.csv")
        }
        videos[case] = read_csv(ROOT / "02-preprocessing" / "outputs" / case / "videos.csv")
        recovery[case] = {
            row["metric"]: row["value"]
            for row in read_csv(case_dir / "recovery_analysis.csv")
        }

        rows = []
        for index, video in enumerate(videos[case]):
            if index < 10:
                window, number = "pre", index + 1
            elif index == 10:
                window, number = "cancel", 1
            else:
                window, number = "post", index - 10
            slot = f"{window}-{number}"
            srow = sentiment_slots[case][slot]
            nrow = network_slots[case][slot]
            rows.append(
                {
                    "slot": slot,
                    "window": window,
                    "number": number,
                    "videoId": video["video_id"],
                    "title": video["title"],
                    "titleEn": TITLE_TRANSLATIONS[case][slot],
                    "date": video["create_time"][:10],
                    "views": int(video["view_count"]),
                    "likes": int(video["like_count"]),
                    "sentiment": num(srow["mean_sentiment"]),
                    "n": int(srow["n_comments"]),
                    "pos": num(srow["pct_positive"]),
                    "neg": num(srow["pct_negative"]),
                    "neu": num(srow["pct_neutral"]),
                    "network": {
                        "nodes": int(nrow["nodes"]),
                        "edges": int(nrow["edges"]),
                        "density": num(nrow["density"]),
                        "modularity": num(nrow["modularity"]),
                        "communities": int(nrow["num_communities"]),
                        "cascade": int(nrow["cascade_depth"]),
                        "inDegreeMean": num(nrow["in_degree_mean"]),
                        "degreeGini": num(nrow["degree_gini"]),
                        "hubDominance": num(nrow["hub_dominance"]),
                        "degreeVariance": num(nrow["degree_variance"]),
                        "components": int(nrow["components"]),
                    },
                }
            )
        assert len(rows) == 21, (case, len(rows))
        # Display chronologically: the earliest pre video first, the apology in
        # the middle, then post videos in upload order. The CSV itself numbers
        # pre videos backwards from the apology (pre-1 is closest to it).
        window_rank = {"pre": 0, "cancel": 1, "post": 2}
        rows.sort(
            key=lambda row: (
                window_rank[row["window"]],
                -row["number"] if row["window"] == "pre" else row["number"],
            )
        )
        slots[case] = rows

        # The report's top-line counts are fixed; verify that the CSVs agree.
        analyzed = sum(row["n"] for row in rows)
        expected = int(recovery[case].get("total_comments", analyzed))
        assert analyzed == expected or expected == analyzed, (case, analyzed)

    def build_thread(case: str) -> dict:
        root_id = CASE_META[case]["threadRoot"]
        rows = read_csv(CASE_DIRS[case] / "sentiment_comments.csv")
        by_id = {row["comment_id"]: row for row in rows}
        children: dict[str, list[dict]] = {}
        for row in rows:
            parent = row["parent_id"]
            if parent in by_id:
                children.setdefault(parent, []).append(row)

        nodes = []
        edges = []

        def visit(row: dict, depth: int, parent_node: str | None) -> None:
            cid = row["comment_id"]
            translation = THREAD_TRANSLATIONS.get(cid)
            if translation is None:
                raise KeyError(f"Missing thread translation for {cid}")
            nodes.append(
                {
                    "id": cid,
                    "parentId": row["parent_id"],
                    "author": row["author"],
                    "handle": row["author"].lstrip("@"),
                    "text": row["text"],
                    "textClean": row["text_clean"],
                    "translation": translation,
                    "sentiment": row["sentiment_label"],
                    "score": num(row["sentiment_score"]),
                    "likes": int(row["like_count"]),
                    "depth": depth,
                    "slot": row["slot"],
                }
            )
            if parent_node is not None:
                parent_row = by_id[row["parent_id"]]
                edges.append(
                    {
                        "source": cid,
                        "target": row["parent_id"],
                        "sourceAuthor": row["author"],
                        "targetAuthor": parent_row["author"],
                    }
                )
            for child in children.get(cid, []):
                visit(child, depth + 1, cid)

        root = by_id[root_id]
        visit(root, 0, None)
        authors = {node["author"] for node in nodes}
        return {
            "rootId": root_id,
            "nodes": nodes,
            "edges": edges,
            "authorCount": len(authors),
            "nodeCount": len(nodes),
            "maxDepth": max(node["depth"] for node in nodes),
            "note": (
                "One real thread. The graph on the right keeps only the unique "
                "authors and the reply links between them."
            ),
        }

    def find_row(case: str, needle: str, slot: str | None = None) -> dict:
        rows = read_csv(CASE_DIRS[case] / "sentiment_comments.csv")
        for row in rows:
            if needle in row["text"] and (slot is None or row["slot"] == slot):
                return row
        raise KeyError((case, needle, slot))

    def build_sentiment_examples(case: str) -> list[dict]:
        specs = [
            ("Positive · apology video", "힘드셨을텐데 잘하셨어요", "cancel"),
            (
                "Negative · apology video",
                "전문경영이 안되서 생긴거같은데? 사업자로 계약한것도 고용하기 싫어서 그런거같고",
                "cancel",
            ),
            ("Neutral · apology video", "이게 사실이면 진짜 악질 나르시시스트네", "cancel"),
            ("Positive · after the apology", "다시 와주셔서 감사합니다❤🎉", "post"),
        ]
        if case == "mimiminu":
            specs = [
                (
                    "Positive · apology video",
                    "뒤처리 고트네.. 롱런하는 이유가 있어~ 응원해 형",
                    "cancel",
                ),
                (
                    "Negative · apology video",
                    "쓰레기 업체 때문에 대미누 돈 깨지누...",
                    "cancel",
                ),
                ("Neutral · apology video", "진짜 이건 자연재해네...ㅠㅠ", "cancel"),
                ("Positive · after the apology", "다사다난한 한해였지만", "post"),
            ]
        out = []
        for label, needle, window in specs:
            row = find_row(case, needle, None)
            assert row["window"] == window, (case, needle, row["window"])
            out.append(
                {
                    "kind": label.split(" · ")[0].lower(),
                    "label": label,
                    "text": row["text"],
                    "translation": SENTIMENT_TRANSLATIONS[row["text"].strip()],
                    "note": SENTIMENT_NOTES[row["text"].strip()],
                    "score": num(row["sentiment_score"]),
                    "sentiment": row["sentiment_label"],
                    "slot": row["slot"],
                    "likes": int(row["like_count"]),
                }
            )
        return out

    def build_cleaning_examples(case: str) -> list[dict]:
        rows = read_csv(
            ROOT / "02-preprocessing" / "outputs" / case / "comments.csv"
        )
        out = []
        for spec in CLEANING_SPECS[case]:
            match = next(row for row in rows if spec["needle"] in row["text"])
            out.append(
                {
                    "label": spec["label"],
                    "slot": match["slot"],
                    "raw": match["text"],
                    "clean": match["text_clean"],
                    "translation": spec["translation"],
                    "operations": spec["operations"],
                    "note": spec["note"],
                    "author": match["author"],
                }
            )
        return out

    def build_dedup(case: str) -> dict:
        spec = DEDUP_SPECS[case]
        raw_path = (
            ROOT / "data" / case / "comments" / f"{spec['slot']}.info.json"
        )
        with raw_path.open(encoding="utf-8") as fh:
            payload = json.load(fh)
        matches = [
            comment
            for comment in payload.get("comments", [])
            if spec["needle"] in (comment.get("text") or "")
        ]
        # A duplicate needs the same author; filter to the pair that repeats.
        by_author: dict[str, list[dict]] = {}
        for comment in matches:
            by_author.setdefault(comment["author_id"], []).append(comment)
        pair = next(group for group in by_author.values() if len(group) >= 2)
        pair = pair[:2]
        return {
            "label": spec["label"],
            "text": pair[0]["text"],
            "author": pair[0]["author"],
            "timestamp": pair[0].get("timestamp", 0),
            "keptId": pair[0]["id"],
            "droppedId": pair[1]["id"],
            "slot": spec["slot"],
            "note": (
                "Same author, same text, same timestamp. The second copy is removed "
                "before any modeling."
            ),
        }

    def build_raw_comment(case: str) -> dict:
        slot = "cancel-1"
        with (ROOT / "data" / case / "comments" / f"{slot}.info.json").open(
            encoding="utf-8"
        ) as fh:
            payload = json.load(fh)
        wanted = CASE_META[case]["threadRoot"]
        comment = next(c for c in payload["comments"] if c["id"] == wanted)
        return {
            key: comment.get(key)
            for key in [
                "id",
                "parent",
                "author",
                "author_id",
                "text",
                "like_count",
                "timestamp",
            ]
        }

    def build_transcript(case: str, lines: int) -> dict:
        path = ROOT / "data" / case / "transcripts" / "cancel-1.ko.txt"
        text = path.read_text(encoding="utf-8").strip()
        excerpt = "\n".join(text.splitlines()[:lines])
        return {
            "text": excerpt,
            "translation": CASE_META[case]["transcriptTranslation"],
            "note": CASE_META[case]["transcriptNote"],
        }

    pearson_rows = {
        row["metric"]: row
        for row in read_csv(ROOT / "04-evaluation" / "outputs" / "pearson_correlation_comparison.csv")
    }
    metric_order = [
        ("in_degree_mean", "Mean in-degree", "How many replies each author receives, on average."),
        ("cascade_depth", "Cascade depth", "The longest reply chain in the graph."),
        ("density", "Density", "Share of all possible author-to-author links that exist."),
        ("nodes", "Nodes", "Unique authors in the window."),
        ("edges", "Edges", "Unique author-to-author reply links."),
        ("num_communities", "Communities", "Louvain communities at resolution 1.0."),
        ("degree_variance", "Degree variance", "Spread in how many connections authors have."),
        ("hub_dominance", "Hub dominance", "How much the largest hub stands out."),
        ("modularity", "Modularity", "How cleanly the graph separates into communities."),
        ("degree_gini", "Degree Gini", "Inequality in the degree distribution."),
    ]
    pearson = []
    for key, label, description in metric_order:
        row = pearson_rows[key]
        pearson.append(
            {
                "key": key,
                "label": label,
                "description": description,
                "bodeoum_tv": {
                    "r": num(row["r (bodeoum_tv)"]),
                    "p": num(row["p (bodeoum_tv)"]),
                    "sig": row["sig (bodeoum_tv)"] == "True",
                },
                "mimiminu": {
                    "r": num(row["r (mimiminu)"]),
                    "p": num(row["p (mimiminu)"]),
                    "sig": row["sig (mimiminu)"] == "True",
                },
            }
        )

    cases = {}
    for case, meta in CASE_META.items():
        rows = slots[case]
        analyzed = sum(row["n"] for row in rows)
        non_empty = meta["raw"] - meta["empty"]
        assert non_empty - meta["duplicates"] == analyzed, (
            case,
            non_empty,
            meta["duplicates"],
            analyzed,
        )
        case_windows = {}
        for window in ("pre", "cancel", "post"):
            srow = sentiment_windows[case][window]
            span = spans[(case, window)]
            case_windows[window] = {
                "mean": num(srow["mean_sentiment"]),
                "n": int(srow["n_comments"]),
                "pos": num(srow["pct_positive"]),
                "neg": num(srow["pct_negative"]),
                "neu": num(srow["pct_neutral"]),
                "slotMean": float(recovery[case][f"{window}_mean"]),
                "start": span["min"],
                "end": span["max"],
                "days": int(span["span_days"]),
                "videos": int(span["n"]),
                "replyLinks": meta["replyLinks"][window],
            }
        nrow = network_windows[case]
        network = {
            "windows": {},
            "amplification": {
                "edges": amplifications[case]["edge_amplification"],
                "nodes": amplifications[case]["node_amplification"],
                "density": amplifications[case]["density_amplification"],
                "gini": amplifications[case]["gini_amplification"],
            },
            "thread": build_thread(case),
        }
        for window in ("pre", "cancel", "post"):
            row = nrow[window]
            network["windows"][window] = {
                "nodes": int(row["nodes"]),
                "edges": int(row["edges"]),
                "density": num(row["density"]),
                "components": int(row["components"]),
                "inDegreeMean": num(row["in_degree_mean"]),
                "inDegreeMax": int(row["in_degree_max"]),
                "degreeGini": num(row["degree_gini"]),
                "hubDominance": num(row["hub_dominance"]),
                "communities": int(row["num_communities"]),
                "modularity": num(row["modularity"]),
                "cascade": int(row["cascade_depth"]),
                "replyLinks": meta["replyLinks"][window],
            }
        total_recovery = {
            "slotMean": {
                "pre": float(recovery[case]["pre_mean"]),
                "cancel": float(recovery[case]["cancel_mean"]),
                "post": float(recovery[case]["post_mean"]),
            },
            "nadirSlot": recovery[case]["nadir_slot"],
            "nadirValue": float(recovery[case]["nadir_value"]),
            "recoverySlot": recovery[case]["recovery_slot"],
            "pctCancelVsPre": float(recovery[case]["pct_change_cancel_vs_pre"]),
            "pctPostVsPre": float(recovery[case]["pct_change_post_vs_pre"]),
        }
        cases[case] = {
            **meta,
            "id": case,
            "nonEmpty": non_empty,
            "analyzed": analyzed,
            "windows": case_windows,
            "slots": rows,
            "recovery": total_recovery,
            "network": network,
            "sentimentExamples": build_sentiment_examples(case),
            "cleaningExamples": build_cleaning_examples(case),
            "dedup": build_dedup(case),
            "rawComment": build_raw_comment(case),
            "transcript": build_transcript(case, 9),
            "apology": next(row for row in rows if row["window"] == "cancel"),
        }

    payload = {
        "meta": {
            "title": "The Dynamics of Cancel Culture",
            "subtitle": (
                "A Social Network and Sentiment Analysis of Influencer Apology "
                "Videos in South Korea"
            ),
            "venue": "FMLDS 2026",
            "authors": [
                "Max Benedict Chavez",
                "Hannah Lee",
                "Edwin Sadiarin Jr.",
                "Raphael Gonda",
            ],
            "affiliation": "De La Salle University, Manila",
            "raw": sum(meta["raw"] for meta in CASE_META.values()),
            "empty": sum(meta["empty"] for meta in CASE_META.values()),
            "duplicates": sum(meta["duplicates"] for meta in CASE_META.values()),
            "analyzed": sum(case["analyzed"] for case in cases.values()),
            "cases": 2,
            "slots": 42,
            "scrape": "April 2026",
            "paper": "docs/fmlds26_networksentiment_cancelculture.pdf",
            "slides": "docs/FMLDS-2026-cancel-culture-slides.pdf",
            "repo": "https://github.com/mbchavez27/cancel-culture-sentiment-analysis",
        },
        "cases": cases,
        "evaluation": {
            "shapiro": {
                "bodeoum_tv": {"p": "< 0.001", "normal": False},
                "mimiminu": {"p": "< 0.001", "normal": False},
                "note": "Shapiro–Wilk on a 5,000-comment random sample; the paper reports non-normal windows for both cases (p < 0.001).",
            },
            "kruskal": {
                "bodeoum_tv": {"H": 4787.54, "df": 2, "p": "< 0.001"},
                "mimiminu": {"H": 169.70, "df": 2, "p": "< 0.001"},
            },
            "dunn": {
                "bodeoum_tv": [
                    {"a": "pre", "b": "cancel", "p": "< 0.001", "sig": True},
                    {"a": "pre", "b": "post", "p": "< 0.001", "sig": True},
                    {"a": "cancel", "b": "post", "p": "< 0.001", "sig": True},
                ],
                "mimiminu": [
                    {"a": "pre", "b": "cancel", "p": "< 0.001", "sig": True},
                    {"a": "pre", "b": "post", "p": "< 0.001", "sig": True},
                    {"a": "cancel", "b": "post", "p": "1.000", "sig": False},
                ],
                "note": "Dunn post-hoc with Bonferroni correction.",
            },
            "pearson": pearson,
        },
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")
    print(f"Analyzed comments: {payload['meta']['analyzed']:,}")


if __name__ == "__main__":
    main()
