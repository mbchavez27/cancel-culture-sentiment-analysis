# Analysis

This module contains modeling, sentiment analysis, and network analysis workflows.

## Notebooks

- `03-analysis/notebooks/02_social_network_analysis.ipynb` - Social network analysis
- `03-analysis/notebooks/04_sentiment_analysis.ipynb` - Sentiment trajectory analysis (reuses the released
  scores unless `RECOMPUTE_SENTIMENT=1`)
- `03-analysis/notebooks/07_time_matched_post_17d.ipynb` - 17-day time-matched post-window robustness check

## Environment

All of stages 02–04 share one uv environment at the repository root:

```bash
uv sync                      # from the repository root
uv run jupyter lab           # then open the notebooks in this folder
```

Per-case notebooks read the case from the `PERSON` environment variable (`bodeoum_tv` by
default). To run the whole pipeline, use `./scripts/run_pipeline.sh` from the repository root.
