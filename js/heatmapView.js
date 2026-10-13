// STUB — Person C replaces this file with View 3 (see PROJECT.md "Views").
// It only proves the view receives filtered data.
let note;

export function init(containerSelector) {
  note = d3.select(containerSelector).append('p').attr('class', 'stub');
}

export function update(filteredData) {
  note.text(`View 3 placeholder (Person C): receiving ${d3.format(',')(filteredData.hourly.length)} hourly rows.`);
}
