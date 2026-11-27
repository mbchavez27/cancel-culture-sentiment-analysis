# Anatomy of a Cancellation

A static, interactive walkthrough of the pipeline behind *The Dynamics of Cancel Culture: A Social Network and Sentiment Analysis of Influencer Apology Videos in South Korea* (FMLDS 2026).

The site reads a single curated JSON file generated from the repository's real analysis outputs. It uses React, TypeScript, and Vite; all charts are hand-built SVG. There is no backend and no runtime data fetching.

## Local development

```bash
cd web
npm install
npm run dev
```

Open the printed local URL. The case switch in the navigation toggles between Bodeoum TV and Mimiminu; the URL carries `?case=mimiminu` for sharing.

## Regenerate the data

The site data is derived from the pipeline outputs, not typed by hand:

```bash
cd web
python3 scripts/generate_data.py
```

The generator reads `02-preprocessing/outputs/`, `03-analysis/outputs/`, `04-evaluation/outputs/`, and the raw comment JSON in `data/`. It verifies that the comment counts reconcile to the paper totals before writing `src/data/cases.json`.

## Production build

```bash
cd web
npm run build
npm run preview
```

The production output is `web/dist/`.

## Docker

Build from the repository root so the Dockerfile can see both `web/` and the copied papers:

```bash
docker build -t cancel-culture-atlas .
docker run --rm -p 8080:80 cancel-culture-atlas
```

Open <http://localhost:8080>. The image is a multi-stage build: Node compiles the site, then nginx serves the static files with an SPA fallback and long-lived asset caching.

## Vercel

Import the repository and set:

- **Root Directory**: `web`
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

`web/vercel.json` records the same build settings. The paper and slides are served from `web/public/docs/`, so the download links work without Vercel rewrites.

## Structure

```
web/
├── scripts/generate_data.py   # pipeline outputs -> src/data/cases.json
├── public/docs/               # paper and presentation PDFs
├── src/
│   ├── components/            # sections and hand-built SVG charts
│   ├── data/cases.json        # generated; do not edit by hand
│   ├── lib/format.ts          # number, date, and chart helpers
│   └── styles.css             # the full editorial design system
└── vercel.json
```

## Provenance note

Every number in the interface comes from the repository's generated CSVs or the paper. The two cases are descriptive comparisons, not a causal experiment: the windows differ in elapsed calendar time, the scrape happened at a single point, and the apology is one video per case. The interface keeps those limits visible rather than resolving them into a single score.
