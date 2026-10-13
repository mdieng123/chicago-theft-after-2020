// trendView.js (Person A)
// View 1: line chart of thefts per month

const trendMargin = { top: 30, right: 30, bottom: 60, left: 80 };
const trendWidth = 800 - trendMargin.left - trendMargin.right;
const trendHeight = 400 - trendMargin.top - trendMargin.bottom;

let trendSvg, trendX, trendY, trendBrush;
let preAverage = 0; // average thefts per month in 2016-2019

function initTrend() {
  // Create SVG
  trendSvg = d3.select('#view-trend')
    .append('svg')
    .attr('width', trendWidth + trendMargin.left + trendMargin.right)
    .attr('height', trendHeight + trendMargin.top + trendMargin.bottom)
    .append('g')
    .attr('transform', `translate(${trendMargin.left},${trendMargin.top})`);

  // Brush: drag across the chart to zoom in on those years
  trendBrush = d3.brushX()
    .extent([[0, 0], [trendWidth, trendHeight]])
    .on('end', brushed);

  trendSvg.append('g').attr('class', 'brush').call(trendBrush);

  // These go after the brush so they are on top of it (so the dots can be hovered)
  trendSvg.append('path').attr('class', 'trend-line');
  trendSvg.append('g').attr('class', 'reference-lines');
  trendSvg.append('g').attr('class', 'dots');
}

function updateTrend(data) {
  // Make a list with every month in the year range
  let months = [];
  for (let year = filters.startYear; year <= filters.endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      months.push({ date: new Date(year, month - 1, 1), count: 0, arrests: 0 });
    }
  }

  // Add up the thefts for each month
  data.forEach(d => {
    let i = (d.year - filters.startYear) * 12 + (d.month - 1);
    months[i].count += d.count;
    months[i].arrests += d.arrests;
  });

  // Average per month before and after.
  // We ignore the year filter here so the average line doesn't move when you zoom in.
  let allYears = filterData(allMonthly, 'years');
  preAverage = d3.sum(allYears.filter(d => d.year <= 2019), d => d.count) / 48;  // 4 years * 12 months
  let postAverage = d3.sum(allYears.filter(d => d.year >= 2021), d => d.count) / 60; // 5 years * 12 months

  updateTrendAxes(months);

  // Draw the line
  let line = d3.line()
    .x(d => trendX(d.date))
    .y(d => trendY(d.count));

  trendSvg.select('.trend-line')
    .datum(months)
    .attr('d', line)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2);

  // Draw a dot for each month (hover for the tooltip)
  trendSvg.select('.dots')
    .selectAll('circle')
    .data(months)
    .join('circle')
    .attr('cx', d => trendX(d.date))
    .attr('cy', d => trendY(d.count))
    .attr('r', 3)
    .style('fill', 'steelblue')
    .on('mouseover', function (event, d) {
      d3.select(this).attr('r', 6);

      let compared = preAverage > 0 ? d3.format('+.0%')(d.count / preAverage - 1) : 'n/a';
      let arrestRate = d.count > 0 ? d3.format('.1%')(d.arrests / d.count) : 'n/a';

      showTooltip(event,
        `<strong>${d3.timeFormat('%B %Y')(d.date)}</strong><br/>
        Thefts: ${d3.format(',')(d.count)}<br/>
        Compared to 2016-2019 average: ${compared}<br/>
        Arrest rate: ${arrestRate}`);
    })
    .on('mouseout', function () {
      d3.select(this).attr('r', 3);
      hideTooltip();
    });

  drawReferenceLines();

  // Caption with the main takeaway
  if (preAverage > 0) {
    let change = Math.round((postAverage - preAverage) / preAverage * 100);
    let changeText = change >= 0 ? 'up ' + change + '%' : 'down ' + (-change) + '%';
    d3.select('#trend-caption').text(
      'Before 2020 there were about ' + d3.format(',')(Math.round(preAverage)) + ' of these thefts per month. ' +
      'Since 2021 there have been about ' + d3.format(',')(Math.round(postAverage)) + ' per month (' + changeText + ').');
  } else {
    d3.select('#trend-caption').text('There are no thefts before 2020 that match these filters.');
  }
}

function updateTrendAxes(months) {
  trendSvg.selectAll('.axis').remove();
  trendSvg.selectAll('.labels').remove();

  // X axis
  trendX = d3.scaleTime()
    .domain(d3.extent(months, d => d.date))
    .range([0, trendWidth]);

  trendSvg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, ${trendHeight})`)
    .call(d3.axisBottom(trendX));

  // Y axis
  let maxCount = d3.max(months, d => d.count);
  trendY = d3.scaleLinear()
    .domain([0, Math.max(maxCount, preAverage) * 1.1 || 1])
    .range([trendHeight, 0]);

  trendSvg.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(trendY));

  // X-axis label
  trendSvg.append('text')
    .attr('class', 'labels')
    .attr('x', trendWidth / 2)
    .attr('y', trendHeight + trendMargin.bottom - 15)
    .attr('text-anchor', 'middle')
    .text('Date');

  // Y-axis label (rotated)
  trendSvg.append('text')
    .attr('class', 'labels')
    .attr('transform', 'rotate(-90)')
    .attr('x', -trendHeight / 2)
    .attr('y', -trendMargin.left + 20)
    .attr('text-anchor', 'middle')
    .text('Thefts per month');
}

// Dashed lines for the 2016-2019 average and the stay-at-home order
function drawReferenceLines() {
  let group = trendSvg.select('.reference-lines');
  group.selectAll('*').remove();

  // 2016-2019 average
  if (preAverage > 0) {
    group.append('line')
      .attr('x1', 0)
      .attr('x2', trendWidth)
      .attr('y1', trendY(preAverage))
      .attr('y2', trendY(preAverage))
      .attr('stroke', 'gray')
      .attr('stroke-dasharray', '5,5');
  }
  d3.select('#trend-note').text(
    'The flat dashed line is the 2016-2019 average (' + d3.format(',')(Math.round(preAverage)) + ' per month).');

  // Stay-at-home order (March 21, 2020), only if 2020 is shown
  let stayHome = new Date(2020, 2, 21);
  if (filters.startYear <= 2020 && filters.endYear >= 2020) {
    group.append('line')
      .attr('x1', trendX(stayHome))
      .attr('x2', trendX(stayHome))
      .attr('y1', 0)
      .attr('y2', trendHeight)
      .attr('stroke', 'gray')
      .attr('stroke-dasharray', '5,5');

    group.append('text')
      .attr('x', trendX(stayHome) + 5)
      .attr('y', 12)
      .style('font-size', '12px')
      .text('Stay-at-home order');
  }
}

// When the user finishes dragging, zoom every chart to the years they picked
function brushed(event) {
  if (!event.selection) return;

  let startDate = trendX.invert(event.selection[0]);
  let endDate = trendX.invert(event.selection[1]);
  filters.startYear = startDate.getFullYear();
  filters.endYear = endDate.getFullYear();

  trendSvg.select('.brush').call(trendBrush.move, null); // remove the gray box
  updateAll();
}
