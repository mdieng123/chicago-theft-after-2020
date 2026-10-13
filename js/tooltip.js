// tooltip.js (Person C)
// One tooltip that every chart uses. The <div id="tooltip"> is in index.html.
// (Person A made this basic version so the charts work now. Person C can change the look.)

function showTooltip(event, html) {
  d3.select('#tooltip')
    .style('display', 'block')
    .html(html)
    .style('left', (event.pageX + 20) + 'px')
    .style('top', (event.pageY - 28) + 'px');
}

function hideTooltip() {
  d3.select('#tooltip').style('display', 'none');
}
