// STUB — Person B replaces this file with View 2 (see PROJECT.md "Views").
// It only proves the view receives filtered data.
let note;

export function init(containerSelector) {
  note = d3.select(containerSelector).append('p').attr('class', 'stub');
}

export function update(filteredData) {
  note.text(`View 2 placeholder (Person B): receiving ${d3.format(',')(filteredData.monthly.length)} monthly rows.`);
}
