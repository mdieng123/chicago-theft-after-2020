// tooltip.js (Person C)
// One tooltip that every chart uses. The <div id="tooltip"> is in index.html.
// Content order: title (bold), count, change vs 2016-2019, arrest rate (when available).

function showTooltip(event, html) {
  let tooltip = d3.select('#tooltip')
    .style('display', 'block')
    .html(html);

  // Put it to the right of the mouse, or to the left if it would go off the screen
  let width = tooltip.node().offsetWidth;
  let left = event.pageX + 20;
  if (left + width > window.scrollX + window.innerWidth - 10) {
    left = event.pageX - width - 20;
  }

  tooltip
    .style('left', left + 'px')
    .style('top', (event.pageY - 28) + 'px');
}

function hideTooltip() {
  d3.select('#tooltip').style('display', 'none');
}
