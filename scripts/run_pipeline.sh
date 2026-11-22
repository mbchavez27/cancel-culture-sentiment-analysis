#!/usr/bin/env bash
# Re-run the full analysis pipeline (02-preprocessing -> 03-analysis -> 04-evaluation).
#
# Usage (from the repository root):
#   uv sync
#   ./scripts/run_pipeline.sh
#
# Environment overrides:
#   PERSONS="bodeoum_tv mimiminu"   cases to process (default: both)
#   RECOMPUTE_SENTIMENT=1           re-run KoELECTRA inference instead of reusing the released
#                                   scores (several hours on CPU for bodeoum_tv)
#
# Notebooks write their CSVs/figures into the stage `outputs/` and `figures/` folders.
# Executed notebook copies (with fresh cell outputs) go to build/executed/, so the committed
# notebooks are left untouched.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PERSONS="${PERSONS:-bodeoum_tv mimiminu}"
OUT_DIR="$ROOT/build/executed"
mkdir -p "$OUT_DIR"

run_nb() {
  local notebook="$1" suffix="$2"
  local name
  name="$(basename "$notebook" .ipynb)${suffix}"
  echo ">>> $notebook ${suffix:+(${suffix#_})}"
  uv run --frozen jupyter nbconvert --to notebook --execute \
    --ExecutePreprocessor.timeout=-1 \
    --output-dir "$OUT_DIR" --output "$name" "$notebook"
}

# 02 — preprocessing
run_nb 02-preprocessing/notebooks/00_window_date_spans.ipynb ""
for person in $PERSONS; do PERSON="$person" run_nb 02-preprocessing/notebooks/01_preprocessing.ipynb "_$person"; done

# 03 — analysis (network first: its slide figures read both cases' network outputs)
for person in $PERSONS; do PERSON="$person" run_nb 03-analysis/notebooks/02_social_network_analysis.ipynb "_$person"; done
for person in $PERSONS; do PERSON="$person" run_nb 03-analysis/notebooks/04_sentiment_analysis.ipynb "_$person"; done
run_nb 03-analysis/notebooks/07_time_matched_post_17d.ipynb ""

# 04 — evaluation
run_nb 04-evaluation/notebooks/05_pearson_correlation.ipynb ""
for person in $PERSONS; do PERSON="$person" run_nb 04-evaluation/notebooks/06_kruskal_wallis_anova.ipynb "_$person"; done

echo "Done. Executed notebooks: $OUT_DIR"
