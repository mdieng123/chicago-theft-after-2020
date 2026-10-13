// heatmapView.js (Person C)
// PLACEHOLDER: Person C replaces this with View 3 (heatmap of year by hour of day).

function initHeatmap() {
  d3.select('#view-heatmap').append('p').attr('class', 'placeholder');
}

function updateHeatmap(data) {
  d3.select('#view-heatmap .placeholder').text('View 3 goes here (Person C). Getting ' + data.length + ' hourly rows.');
}
