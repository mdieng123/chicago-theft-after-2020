# Chicago Theft After 2020

**Question:** How did Chicago theft patterns shift after 2020?

An interactive D3 visualization with three linked views (monthly trend, what changed, time of day) driven by one shared filter panel.

- **Read [`PROJECT.md`](PROJECT.md) first.** It is the team contract: data schema, shared APIs, file ownership and style. Paste it into your AI assistant's context before you start.
- **Log your work in [`LOG.md`](LOG.md)** every session (hours and AI usage).
- **Past lab for reference:** [`reference/lab4-5/`](reference/lab4-5/) (Gapminder bubble chart: d3.csv loading, dropdowns, slider, tooltips, join/transitions). Reference only; the project code lives at the repo root.

## Team
| Person | Owns |
|---|---|
| A | Data pipeline, page skeleton, `state.js`, deploy, View 1 (monthly trend) |
| B | Filter panel (`controls.js`), View 2 (what changed), cross-view linking |
| C | Tooltip, View 3 (heatmap), CSS/layout, annotations, write-up edit, demo video |

## Getting the data
The portal's Export button times out on the full dataset (8M+ rows). Use the API instead:

```bash
./scripts/download_raw.sh
```

This saves ~716k theft rows to `data/raw/` (gitignored). Then aggregate them into the small committed files in `data/`:

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/prepare_data.py
```

You only need to do this if the cleaning rules change. The output files are already committed.

## Run locally
```bash
python -m http.server
```
Then open http://localhost:8000.
