// Loads the data once, initializes every view, and re-renders them on each filter change.
// Owner: A. Views should not load data themselves.
import { onChange, applyFilters } from './state.js';
import * as controls from './controls.js';
import * as trendView from './trendView.js';
import * as changeView from './changeView.js';
import * as heatmapView from './heatmapView.js';

const NUMERIC = ['year', 'month', 'hour', 'arrests', 'count'];

function parseRow(d) {
  for (const key of NUMERIC) if (key in d) d[key] = +d[key];
  return d;
}

const [monthly, hourly, lookups] = await Promise.all([
  d3.csv('data/theft_monthly.csv', parseRow),
  d3.csv('data/theft_hourly.csv', parseRow),
  d3.json('data/lookups.json'),
]);

// Add fields every view needs: `primary` (for the Theft / Motor vehicle filter) and `period`.
const periodOf = year =>
  Object.keys(lookups.periods).find(p => year >= lookups.periods[p][0] && year <= lookups.periods[p][1]);
for (const rows of [monthly, hourly]) {
  for (const d of rows) {
    d.primary = lookups.type_primary[d.type_group];
    d.period = periodOf(d.year);
  }
}

const data = { monthly, hourly };

// Fill any computed numbers in the page text, e.g. <span data-stat="total"></span>.
d3.selectAll('[data-stat="total"]').text(d3.format(',')(d3.sum(monthly, d => d.count)));

const views = [
  [controls, '#controls'],
  [trendView, '#view-trend'],
  [changeView, '#view-change'],
  [heatmapView, '#view-heatmap'],
];

for (const [view, selector] of views) view.init(selector, data, lookups);

function render() {
  const filtered = { monthly: applyFilters(monthly), hourly: applyFilters(hourly) };
  for (const [view] of views) view.update(filtered);
}

onChange(render);
render();
