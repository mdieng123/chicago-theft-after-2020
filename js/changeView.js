// changeView.js (Person B)
// PLACEHOLDER: Person B replaces this with View 2 (bars showing % change before vs after).

function initChange() {
  d3.select('#view-change').append('p').attr('class', 'placeholder');
}

function updateChange(data) {
  d3.select('#view-change .placeholder').text('View 2 goes here (Person B). Getting ' + data.length + ' monthly rows.');
}
