// STUB — Person B replaces this file with the real filter panel (see PROJECT.md "Controls").
// It only shows the summary line and a Reset button so the views can be tested together.
import { filters, resetFilters } from './state.js';

let summary;

export function init(containerSelector) {
  const root = d3.select(containerSelector);
  summary = root.append('p').attr('class', 'summary');
  root.append('button').attr('type', 'button').text('Reset').on('click', resetFilters);
}

export function update(filteredData) {
  const total = d3.sum(filteredData.monthly, d => d.count);
  const [y0, y1] = filters.yearRange;
  summary.text(`Showing ${d3.format(',')(total)} thefts · ${y0}–${y1}`);
}
