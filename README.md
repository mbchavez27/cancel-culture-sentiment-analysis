# The Dynamics of Cancel Culture: A Social Network and Sentiment Analysis of Influencer Apology Videos in South Korea

![FMLDS 2026](https://img.shields.io/badge/FMLDS-2026-b31b1b)
![IEEE](https://img.shields.io/badge/IEEE-00629B)

This repository is for a study of YouTube audience reactions to two South Korean influencer
controversies (Bodeoum TV and Mimiminu) across pre-cancel, cancel, and post-apology windows.
Comment sentiment is scored with a Korean ELECTRA model
([`Copycats/koelectra-base-v3-generalized-sentiment-analysis`](https://huggingface.co/Copycats/koelectra-base-v3-generalized-sentiment-analysis)),
and comment-reply networks are analyzed with NetworkX.

Max Benedict Chavez, Hannah Lee, Edwin Sadiarin Jr., Raphael Gonda (De La Salle University)

## Publication History

| Date | Milestone |
|---|---|
| 2026-07-15 | Accepted to FMLDS 2026 |
| 2026-11-21 | Presented at FMLDS 2026, University of Hyogo, Kobe, Japan |

Published in the FMLDS 2026 proceedings (IEEE). <!-- TODO: add DOI link -->

## Project structure

```text
├── 01-collection          # YouTube scraper + Whisper transcriber (own uv environments)
├── 02-preprocessing       # Raw JSON -> comments, reply edges, transcripts
├── 03-analysis            # Network analysis, sentiment analysis, robustness check
├── 04-evaluation          # Pearson correlation, Kruskal-Wallis / Dunn tests
├── data                   # Pseudonymized raw data
│   ├── bodeoum_tv
│   ├── mimiminu
│   └── input              # Video lists with window labels
└── scripts                # run_pipeline.sh, pseudonymize.py
```

## Setting up

This project uses [uv](https://docs.astral.sh/uv/) to manage packages.

1. Run `uv sync` to create the environment (Python 3.14, versions pinned in `uv.lock`).
2. Run `uv run jupyter lab` to open the notebooks.

## Reproduction

Run the full pipeline (02-preprocessing → 03-analysis → 04-evaluation):

```bash
./scripts/run_pipeline.sh
```

By default the released sentiment scores are reused. To re-run model inference (several hours
on CPU), use `RECOMPUTE_SENTIMENT=1 ./scripts/run_pipeline.sh`. Notebooks that run one case at a
time read it from `PERSON` (default `bodeoum_tv`), e.g. `PERSON=mimiminu uv run jupyter lab`.

> [!NOTE]
> The Kruskal-Wallis H values have been updated since publication: 6312.98 (Bodeoum TV) and
> 182.97 (Mimiminu) on the full released data. Conclusions are unchanged.

## Datasets

All datasets are in the `data/` directory, and outputs from each stage are in that stage's
`outputs/` folder. Commenter channel IDs, comment IDs, handles, and `@mentions` were
pseudonymized with `scripts/pseudonymize.py`. The data is for research use only. If you appear
in the data and want a comment removed, please open an issue.

## Citation

See [`CITATION.cff`](CITATION.cff), or use "Cite this repository" on GitHub.

## License

[MIT](LICENSE)
