// trendView.js (Person A)
// View 1: line chart of thefts per month.
// Hover to see details for a month. Drag across the chart to zoom all charts to those years.

const trendMargin = { top: 40, right: 100, bottom: 50, left: 70 };  // extra room on the right for the average label
const trendWidth = 900 - trendMargin.left - trendMargin.right;
const trendHeight = 400 - trendMargin.top - trendMargin.bottom;

let trendSvg, trendX, trendY, trendBrush;
let trendMonths = [];  // one object per month that is currently shown
let trendTotal = 0;
let preAverage = 0;    // average thefts per month in 2016-2019

// The three periods we compare (shaded in the background)
const periods = [
  { name: 'Before (2016–19)', start: 2016, end: 2019, className: 'band-pre' },
  { name: '2020', start: 2020, end: 2020, className: 'band-covid' },
  { name: 'After (2021–25)', start: 2021, end: 2025, className: 'band-post' }
];

// Illinois stay-at-home order started March 21, 2020
const stayHomeDate = new Date(2020, 2, 21);

function initTrend() {
  trendSvg = d3.select('#view-trend')
    .append('svg')
    .attr('width', trendWidth + trendMargin.left + trendMargin.right)
    .attr('height', trendHeight + trendMargin.top + trendMargin.bottom)
    .append('g')
    .attr('transform', `translate(${trendMargin.left},${trendMargin.top})`);

  // Make the groups in order so the shaded bands are in the back
  trendSvg.append('g').attr('class', 'bands');
  trendSvg.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${trendHeight})`);
  trendSvg.append('g').attr('class', 'y-axis');
  trendSvg.append('path').attr('class', 'trend-line');
  trendSvg.append('g').attr('class', 'reference-lines');
  trendSvg.append('circle').attr('class', 'hover-dot').attr('r', 5).style('display', 'none');

  // X-axis label
  trendSvg.append('text')
    .attr('class', 'axis-label')
    .attr('x', trendWidth / 2)
    .attr('y', trendHeight + 40)
    .attr('text-anchor', 'middle')
    .text('Month');

  // Y-axis label (rotated)
  trendSvg.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -trendHeight / 2)
    .attr('y', -55)
    .attr('text-anchor', 'middle')
    .text('Thefts per month');

  // Brush: drag across the chart to pick years
  trendBrush = d3.brushX()
    .extent([[0, 0], [trendWidth, trendHeight]])
    .on('end', brushed);

  // The brush covers the whole chart, so we also use it for the hover tooltip
  trendSvg.append('g')
    .attr('class', 'brush')
    .call(trendBrush)
    .on('mousemove', showTrendTooltip)
    .on('mouseleave', hideTrendTooltip);
}

function updateTrend(data) {
  // Make an empty entry for every month in the year range
  trendMonths = [];
  for (let year = filters.startYear; year <= filters.endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      trendMonths.push({ year: year, month: month, date: new Date(year, month - 1, 15), count: 0, arrests: 0 });
    }
  }

  // Add up the thefts for each month
  data.forEach(d => {
    const i = (d.year - filters.startYear) * 12 + (d.month - 1);
    trendMonths[i].count += d.count;
    trendMonths[i].arrests += d.arrests;
  });
  trendTotal = d3.sum(trendMonths, d => d.count);

  // Monthly averages before and after. These ignore the year filter
  // so the average line stays in the same place when you zoom in.
  const allYears = filterData(allMonthly, 'years');
  preAverage = d3.sum(allYears.filter(d => d.year <= 2019), d => d.count) / 48;  // 4 years * 12 months
  const postAverage = d3.sum(allYears.filter(d => d.year >= 2021), d => d.count) / 60; // 5 years * 12 months

  // Scales
  trendX = d3.scaleTime()
    .domain([new Date(filters.startYear, 0, 1), new Date(filters.endYear + 1, 0, 1)])
    .range([0, trendWidth]);

  const maxCount = d3.max([d3.max(trendMonths, d => d.count), preAverage]);
  trendY = d3.scaleLinear()
    .domain([0, maxCount * 1.1 || 1])
    .range([trendHeight, 0]);

  // Axes
  trendSvg.select('.x-axis').call(d3.axisBottom(trendX));
  trendSvg.select('.y-axis').call(d3.axisLeft(trendY).tickFormat(d3.format(',')));

  drawBands();

  // The line
  const line = d3.line()
    .x(d => trendX(d.date))
    .y(d => trendY(d.count));

  trendSvg.select('.trend-line')
    .datum(trendMonths)
    .attr('d', line);

  drawReferenceLines();

  // Caption with the main takeaway (changes with the filters)
  if (preAverage > 0) {
    const change = (postAverage - preAverage) / preAverage;
    d3.select('#trend-caption').text(
      'Before 2020 there were about ' + d3.format(',')(Math.round(preAverage)) + ' of these thefts per month. ' +
      'Since 2021 there have been about ' + d3.format(',')(Math.round(postAverage)) + ' per month (' + d3.format('+.0%')(change) + ').'
    );
  } else {
    d3.select('#trend-caption').text('No thefts before 2020 match these filters.');
  }
}

// Shaded background for each period (only the parts inside the year range)
function drawBands() {
  const shown = periods.filter(p => p.end >= filters.startYear && p.start <= filters.endYear);

  const bandStart = p => trendX(new Date(Math.max(p.start, filters.startYear), 0, 1));
  const bandEnd = p => trendX(new Date(Math.min(p.end, filters.endYear) + 1, 0, 1));

  trendSvg.select('.bands').selectAll('rect')
    .data(shown)
    .join('rect')
    .attr('class', p => p.className)
    .attr('x', bandStart)
    .attr('width', p => bandEnd(p) - bandStart(p))
    .attr('y', 0)
    .attr('height', trendHeight);

  trendSvg.select('.bands').selectAll('text')
    .data(shown)
    .join('text')
    .attr('class', 'band-label')
    .attr('x', p => (bandStart(p) + bandEnd(p)) / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .text(p => p.name);
}

// Dashed lines for the 2016-19 average and the stay-at-home order
function drawReferenceLines() {
  const group = trendSvg.select('.reference-lines');
  group.selectAll('*').remove();  // clear the old lines

  if (preAverage > 0) {
    group.append('line')
      .attr('class', 'ref-line')
      .attr('x1', 0)
      .attr('x2', trendWidth)
      .attr('y1', trendY(preAverage))
      .attr('y2', trendY(preAverage));

    // Label goes to the right of the chart so the line never covers it
    group.append('text')
      .attr('class', 'ref-label')
      .attr('x', trendWidth + 8)
      .attr('y', trendY(preAverage) - 2)
      .text('2016–19 avg:');

    group.append('text')
      .attr('class', 'ref-label')
      .attr('x', trendWidth + 8)
      .attr('y', trendY(preAverage) + 12)
      .text(d3.format(',')(Math.round(preAverage)) + '/month');
  }

  // Only draw the stay-at-home line if 2020 is in the range
  if (filters.startYear <= 2020 && filters.endYear >= 2020) {
    group.append('line')
      .attr('class', 'ref-line')
      .attr('x1', trendX(stayHomeDate))
      .attr('x2', trendX(stayHomeDate))
      .attr('y1', 0)
      .attr('y2', trendHeight);

    group.append('text')
      .attr('class', 'ref-label')
      .attr('x', trendX(stayHomeDate) + 5)
      .attr('y', 15)
      .text('Stay-at-home order (March 2020)');
  }
}

function showTrendTooltip(event) {
  if (event.buttons > 0) return;  // don't show it while dragging

  // Find the month under the mouse
  const mouseX = d3.pointer(event)[0];
  const date = trendX.invert(mouseX);
  const i = (date.getFullYear() - filters.startYear) * 12 + date.getMonth();
  const d = trendMonths[i];
  if (!d) return;

  // Move the dot to that month
  trendSvg.select('.hover-dot')
    .style('display', null)
    .attr('cx', trendX(d.date))
    .attr('cy', trendY(d.count));

  const share = trendTotal > 0 ? d.count / trendTotal : 0;
  const vsAverage = preAverage > 0 ? d3.format('+.0%')(d.count / preAverage - 1) : 'n/a';
  const arrestRate = d.count > 0 ? d3.format('.1%')(d.arrests / d.count) : 'n/a';

  showTooltip(event,
    `<strong>${d3.timeFormat('%B %Y')(d.date)}</strong><br/>
    Thefts: ${d3.format(',')(d.count)}<br/>
    Share of selection: ${d3.format('.1%')(share)}<br/>
    Compared to 2016–19 average: ${vsAverage}<br/>
    Arrest rate: ${arrestRate}`
  );
}

function hideTrendTooltip() {
  trendSvg.select('.hover-dot').style('display', 'none');
  hideTooltip();
}

// When the user finishes dragging, zoom every chart to the years they picked
function brushed(event) {
  if (!event.selection) return;

  const startDate = trendX.invert(event.selection[0]);
  const endDate = trendX.invert(event.selection[1]);

  filters.startYear = startDate.getFullYear();
  filters.endYear = Math.min(endDate.getFullYear(), filters.endYear);

  trendSvg.select('.brush').call(trendBrush.move, null);  // remove the gray box
  hideTrendTooltip();
  updateAll();
}
