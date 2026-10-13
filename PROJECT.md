# PROJECT.md — Chicago Theft After 2020

> **For AI assistants:** This file is the team's shared contract. Follow it exactly. Only edit the files your human owner is assigned (see "Ownership"). If a change to a shared file (`state.js`, `tooltip.js`, `style.css`, data files) seems necessary, describe it to your human instead of making it.

## Question
**How did Chicago theft patterns shift after 2020?**

We compare three periods:

| Period key | Years | Meaning |
|---|---|---|
| `pre` | 2016–2019 | Baseline |
| `covid` | 2020 | Pandemic year (shown, but not counted in either average) |
| `post` | 2021–2025 | After |

2026 is excluded because it is a partial year. The source also omits the most recent 7 days.

**"Patterns" means three things, one per view:**
1. **How much:** monthly volume over time (View 1)
2. **What and where:** which theft types and location types grew or shrank (View 2)
3. **When:** time of day, and how it changed by year (View 3)

## Required interactions (from the assignment)
- **Category I, dynamic queries:** A shared filter panel (year range, theft type, location type, city side). Every view updates when any filter changes. Clicking a bar in View 2 also sets a filter.
- **Category II, details-on-demand:** Every mark has a tooltip showing the count, the share of the total, change versus the `pre` average, and the arrest rate where available.

## Data

### Source
Chicago Data Portal, *Crimes – 2001 to Present* (Socrata dataset id `ijzp-q8t2`; verify on the portal page). Cite it in the write-up.

Columns used: `Date`, `Primary Type`, `Description`, `Location Description`, `Arrest`, `Community Area`, `Year`.

### Scope filter (in `scripts/prepare_data.py`)
- `Primary Type` in `THEFT` or `MOTOR VEHICLE THEFT`
- `Year` from 2016 to 2025 inclusive

Avoid downloading the full ~2 GB CSV if possible. Instead, query the Socrata API with a `$where` clause and page through it with `$limit` and `$offset`. Write the raw pull to `data/raw/` and **gitignore it**. Only the small aggregated files are committed.

### Derived fields
Before writing the grouping rules, print `value_counts()` for each source column. Category spellings vary across years (e.g. `RESIDENCE-GARAGE` vs `RESIDENCE - GARAGE`), so match on keywords, not exact strings.

**`type_group`**

| Group | Source rows |
|---|---|
| `Retail` | THEFT whose Description contains "RETAIL" |
| `From building` | THEFT, "FROM BUILDING" |
| `Pickpocket/purse` | THEFT, "POCKET" or "PURSE" |
| `Over $500` | THEFT, "OVER $500" |
| `$500 & under` | THEFT, "$500 AND UNDER" |
| `Other theft` | All remaining THEFT rows |
| `Automobile` | MOTOR VEHICLE THEFT, "AUTOMOBILE" |
| `Other vehicle` | All remaining MOTOR VEHICLE THEFT rows |

**`loc_group`**

| Group | Location Description contains |
|---|---|
| `Street/alley` | STREET, SIDEWALK, ALLEY |
| `Residence` | RESIDENCE, APARTMENT, PORCH, YARD, HOUSE |
| `Retail store` | STORE, RETAIL, GROCERY, DEPARTMENT, CONVENIENCE |
| `Restaurant/bar` | RESTAURANT, BAR, TAVERN |
| `Transit` | CTA, TRAIN, BUS, PLATFORM |
| `Parking` | PARKING, GARAGE (non-residential) |
| `Commercial/office` | OFFICE, COMMERCIAL, BUSINESS |
| `Other` | Everything else, including missing values |

**Other fields**
- **`side`:** Map `Community Area` (1–77) to Chicago's 9 official "sides" (Far North, Northwest, North, West, Central, South, Southwest, Far Southwest, Far Southeast). Cite the mapping source. Missing values become `Unknown`.
- **`hour`:** 0–23, taken from `Date`.
- **`arrest`:** 0 or 1.

### Known data quirk
Many thefts are recorded at exactly **12:00 AM**, often on the 1st of the month. This happens when the true time is unknown, especially for reported-later thefts. In View 3, show hour 0 with a hatched pattern or a note so the spike isn't read as a real midnight surge. Mention this in the write-up.

### Output files (committed, each ideally under 5 MB)

**`data/theft_monthly.csv`**, used by Views 1 and 2:
```
year,month,type_group,loc_group,side,arrests,count
2016,1,Retail,Retail store,Central,41,212
```

**`data/theft_hourly.csv`**, used by View 3:
```
year,hour,type_group,loc_group,side,count
```

**`data/lookups.json`**
```json
{
  "type_groups": [...],
  "loc_groups": [...],
  "sides": [...],
  "periods": { "pre": [2016, 2019], "covid": [2020, 2020], "post": [2021, 2025] }
}
```

All numbers shown on the page must be computed from these files. Nothing is hardcoded.

## Tech
- D3 v7 from CDN: `https://cdn.jsdelivr.net/npm/d3@7`
- Plain ES modules with no build step and no other libraries unless the team agrees
- Local dev: `python -m http.server`, then open `localhost:8000`
- Deployed with GitHub Pages from `main` (root)

## File structure and ownership

```
index.html              A  (layout skeleton; C may edit layout/sections)
css/style.css           C  (A seeds tokens below)
js/main.js              A  loads data, inits views, wires state
js/state.js             A  shared filter state (API below)
js/tooltip.js           C  shared tooltip (API below)
js/controls.js          B  filter panel
js/trendView.js         A  View 1
js/changeView.js        B  View 2
js/heatmapView.js       C  View 3
scripts/prepare_data.py A
data/*.csv, *.json      A
LOG.md                  all (hours and AI usage, append-only)
```

## Shared APIs

### `js/state.js`
```js
// Default filters; null means "all"
export const filters = {
  yearRange: [2016, 2025],
  primaryTypes: ['THEFT', 'MOTOR VEHICLE THEFT'],
  typeGroups: null,   // array of type_group strings or null
  locGroups: null,
  sides: null,
};

export function setFilters(patch) { /* shallow-merge, then notify listeners */ }
export function resetFilters() { /* restore defaults, then notify */ }
export function onChange(fn) { /* fn(filters) is called after every change */ }

// Returns the rows matching the current filters.
// `ignore` lists filter keys to skip, so a view can avoid filtering on its own
// dimension (e.g. View 2 passes ['typeGroups'] when showing type bars).
export function applyFilters(rows, { ignore = [] } = {}) { ... }
```

### View contract
Every view module exports:
```js
export function init(containerSelector, data, lookups) {}
export function update(filteredData) {}
```
`main.js` calls `init` once and `update` on every `onChange`.

### `js/tooltip.js`
```js
export function show(event, { title, rows }) {}  // rows: [[label, value], ...]
export function move(event) {}
export function hide() {}
```
Tooltip content convention, in this order:
1. Title
2. Count
3. Share of current selection
4. Change vs `pre` average (signed %)
5. Arrest rate, when available

## Views

**View 1, monthly trend (A)**
- Line chart of monthly counts, 2016–2025.
- Background bands shade the `pre`, `covid` and `post` periods.
- A dashed line marks the March 2020 stay-at-home order.
- A dashed horizontal line shows the `pre` monthly average.
- Tooltip on hover (snap to the nearest month).

**View 2, what changed (B)**
- Diverging horizontal bar chart: % change in average annual count, `pre` → `post`, sorted by change.
- A toggle switches between grouping by `type_group` and by `loc_group`.
- Clicking a bar sets that filter, and clicking it again clears it. Selected bars are highlighted.
- Tooltip shows `pre` average, `post` average, % change and arrest rates.

**View 3, when thefts happen (C)**
- Heatmap with rows = year (2016–2025) and columns = hour (0–23).
- Cell color = share of that year's thefts falling in that hour. Each row is normalized, so years with different totals are comparable.
- Hour 0 is marked as unreliable (see data quirk).
- Tooltip shows the count, share and change vs the `pre` share for that hour.

**Controls (B)**, a panel above the views:
- year range (two selects or a dual slider)
- Theft / Motor vehicle theft checkboxes
- type group and location group multi-selects
- side dropdown
- Reset button
- A visible summary line, e.g. "Showing 412,903 thefts · 2016–2025 · All types · All sides"

## Style tokens (`css/style.css`)
```css
:root {
  --color-pre:   #4C78A8;
  --color-covid: #9D9D9D;
  --color-post:  #E45756;
  --color-increase: #E45756;
  --color-decrease: #4C78A8;
  --color-text:  #1f2328;
  --color-muted: #6b7280;
  --color-bg:    #ffffff;
  --color-grid:  #e5e7eb;
  --font-body: system-ui, -apple-system, "Segoe UI", sans-serif;
  --chart-width: 900px;
}
```
- Heatmap scale: `d3.interpolateYlOrRd`.
- Number format: `d3.format(',')` for counts, `d3.format('+.0%')` for change.
- Every chart needs a title, axis labels with units, and a one-sentence caption stating the takeaway.

## Write-up (at the bottom of `index.html`)
| Section | Drafted by |
|---|---|
| Dataset intro and subset | A |
| Design rationale for each view and the controls (including alternatives considered) | Each view's owner |
| References (data portal, sides mapping, D3, any examples adapted) | A |
| Development process: who did what, people-hours, what took longest | All, from `LOG.md` |
| AI usage summary | All, from `LOG.md` |

C edits all sections into one voice.

## Team rules
1. Commit small and often, and open a PR for anything that touches a shared file.
2. Integrate early. All three views should be linked through `state.js`, even if they're ugly, before anyone polishes.
3. Log hours and AI usage in `LOG.md` as you go, e.g. `2026-10-14 | B | 2.0h | controls.js | used Claude to scaffold multi-select`.
4. Before merging, test with at least two filter combinations and check that the console has no errors.
