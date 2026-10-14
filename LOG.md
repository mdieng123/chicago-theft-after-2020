# Work log

Append-only. One line per work session. This feeds the write-up's people-hours and AI usage sections.

Format: `date | person | hours | files touched | what you did (and how AI was used)`

| Date | Person | Hours | Files | Notes / AI usage |
|---|---|---|---|---|
| 2026-10-13 | A | 0.5h | repo setup | Created repo, PROJECT.md, folder structure (used Claude to set up repo and API download script) |
| 2026-10-13 | A | 1.0h | scripts/prepare_data.py, data/* | Downloaded 716,105 theft rows via API; wrote cleaning/aggregation script; checked groupings against real value counts (used Claude to write script and audit keyword matches) |
| 2026-10-13 | A | 2.0h | index.html, js/main.js, js/state.js, js/trendView.js, css/style.css, stubs | Built page skeleton, shared state, View 1 (hover tooltip + drag to zoom years), data and View 1 write-up sections, references; tested filter combos with no console errors (used Claude to write code and test in browser) |
| 2026-10-13 | A | 1.0h | all js, index.html, css, prepare_data.py, PROJECT.md | Rewrote code to match our Labs 4-5 style (plain script files, global functions, simple tooltip) and simplified the write-up; retested zoom, tooltip and filters (used Claude) |
| 2026-10-13 | A | 0.5h | trendView.js, index.html, style.css | Made the page and View 1 plainer (dots + line like the labs, less formatting); retested (used Claude) |

| 2026-10-13 | B | 3.5h | js/controls.js, js/changeView.js | Implemented interactive filters and View 2 percentage-change bar chart with linked filtering (used ChatGPT to help write D3 code and debug) |
| 2026-10-14 | B | 2.0h | js/controls.js, js/changeView.js | Tested dropdowns, bar selection and clearing, shared chart updates, and browser console; checked that interactions worked correctly (used ChatGPT to help troubleshoot) |
| 2026-10-14 | B | 1.0h | index.html, LOG.md | Wrote View 2 and filter design rationale, documented AI usage, and updated work log|
