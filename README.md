# Chicago Theft After 2020

**Question:** How did Chicago theft patterns shift after 2020?

An interactive D3 visualization with three linked views (monthly trend, what changed, time of day) driven by one shared filter panel.

- **Read [`PROJECT.md`](PROJECT.md) first.** It is the team contract: data schema, shared APIs, file ownership and style. Paste it into your AI assistant's context before you start.
- **Log your work in [`LOG.md`](LOG.md)** every session (hours and AI usage).
- **Past lab for reference:** [`reference/lab4-5/`](reference/lab4-5/) (Gapminder bubble chart: d3.csv loading, dropdowns, slider, tooltips, join/transitions). Reference only; the project code lives at the repo root.

## Status (October 13, 2026): where to pick up
**Person A is done:** data, page, shared filters (`js/state.js`), loading (`js/main.js`), View 1 (`js/trendView.js`, line chart with tooltip and drag-to-zoom), and the A parts of the write-up. Live site: https://mdieng123.github.io/chicago-theft-after-2020/

**Person B, next:**
1. `js/controls.js`: replace the placeholder with the real filters (year range, Theft / Motor vehicle checkboxes, type, location and side dropdowns, Reset, summary line).
2. `js/changeView.js`: replace the placeholder with View 2 (bars of % change before vs after, click a bar to filter).
3. Write the View 2 and Filters parts of the write-up in `index.html`.

**Person C, next:**
1. `js/heatmapView.js`: replace the placeholder with View 3 (year by hour heatmap, midnight marked as unreliable).
2. Polish `css/style.css` and `js/tooltip.js` (basic versions are already there and working). Keep it plain like the labs.
3. Write the View 3 part of the write-up, edit the whole write-up into one voice, record the demo video.

**For everyone's AI assistant:** read `PROJECT.md` first and copy the style of `js/trendView.js` and `reference/lab4-5/js/script.js`. Keep the function names from the placeholders. Test with a few filters and check the console for errors before pushing. Add a line to `LOG.md` for every work session.

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
python3 -m http.server
```
Then open http://localhost:8000.
