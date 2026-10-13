// controls.js (Person B)
// PLACEHOLDER: Person B replaces this with the real filters
// (year range, Theft / Motor vehicle checkboxes, type, location and side dropdowns).
// For now it only shows the summary line and a Reset button.

function initControls() {
  d3.select('#controls').append('p').attr('id', 'summary');
  d3.select('#controls').append('button').text('Reset').on('click', resetFilters);
}

function updateControls(data) {
  const total = d3.sum(data, d => d.count);
  d3.select('#summary').text('Showing ' + d3.format(',')(total) + ' thefts · ' + filters.startYear + '–' + filters.endYear);
}
