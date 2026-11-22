# Evaluation

This module contains validation, benchmarking, and result quality checks.

## Notebooks

- `04-evaluation/notebooks/05_pearson_correlation.ipynb` - Correlation between sentiment and network metrics
- `04-evaluation/notebooks/06_kruskal_wallis_anova.ipynb` - Shapiro-Wilk, Kruskal-Wallis H and Dunn post-hoc tests
  across windows (reads `03-analysis/outputs/<case>/sentiment_comments.csv`)

## Environment

All of stages 02–04 share one uv environment at the repository root:

```bash
uv sync                      # from the repository root
uv run jupyter lab           # then open the notebooks in this folder
```

Per-case notebooks read the case from the `PERSON` environment variable (`bodeoum_tv` by
default). To run the whole pipeline, use `./scripts/run_pipeline.sh` from the repository root.
