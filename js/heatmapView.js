// heatmapView.js (Person C)
// View 3: heatmap of year (rows) by hour of day (columns).
// Each cell's color = share of that year's thefts in that hour, so years with different totals can be compared.

const heatmapMargin = { top: 60, right: 80, bottom: 100, left: 60 };
const heatmapWidth = 800 - heatmapMargin.left - heatmapMargin.right;
const heatmapHeight = 400 - heatmapMargin.top - heatmapMargin.bottom;

let heatmapSvg, heatmapX, heatmapY, heatmapColor;
let heatmapPreShares = []; // share of thefts in each hour in 2016-2019 (the baseline)

const heatmapHours = d3.range(0, 24);
const heatmapNight = [1, 5];      // 1 AM to 5 AM (the hours we point out in the annotation)
const heatmapAfternoon = [12, 17]; // 12 PM to 5 PM

// 0 -> "12 AM", 13 -> "1 PM"
function hourLabel(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return h + ' AM';
  if (h === 12) return '12 PM';
  return (h - 12) + ' PM';
}

function initHeatmap() {
  let svg = d3.select('#view-heatmap')
    .append('svg')
    .attr('width', heatmapWidth + heatmapMargin.left + heatmapMargin.right)
    .attr('height', heatmapHeight + heatmapMargin.top + heatmapMargin.bottom);

  // Diagonal stripes to mark the 12 AM column as unreliable
  let defs = svg.append('defs');
  defs.append('pattern')
    .attr('id', 'heatmap-hatch')
    .attr('width', 6)
    .attr('height', 6)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('patternTransform', 'rotate(45)')
    .append('line')
    .attr('x1', 0).attr('y1', 0)
    .attr('x2', 0).attr('y2', 6)
    .attr('stroke', '#555')
    .attr('stroke-width', 1.5);

  // Color gradient for the legend
  let gradient = defs.append('linearGradient').attr('id', 'heatmap-gradient');
  d3.range(0, 1.01, 0.1).forEach(t => {
    gradient.append('stop')
      .attr('offset', (t * 100) + '%')
      .attr('stop-color', d3.interpolateYlOrRd(t));
  });

  heatmapSvg = svg.append('g')
    .attr('transform', `translate(${heatmapMargin.left},${heatmapMargin.top})`);

  heatmapSvg.append('g').attr('class', 'cells');
  heatmapSvg.append('g').attr('class', 'hatch');
  heatmapSvg.append('g').attr('class', 'periods');
  heatmapSvg.append('g').attr('class', 'annotation');
  heatmapSvg.append('g').attr('class', 'legend');

  // X scale never changes (always 24 hours)
  heatmapX = d3.scaleBand()
    .domain(heatmapHours)
    .range([0, heatmapWidth])
    .padding(0.05);
}

function updateHeatmap(data) {
  // Make one cell for every year and hour
  let years = d3.range(filters.startYear, filters.endYear + 1);
  let cells = [];
  years.forEach(year => {
    heatmapHours.forEach(hour => {
      cells.push({ year: year, hour: hour, count: 0, share: 0, yearTotal: 0 });
    });
  });

  // Add up the thefts for each cell
  data.forEach(d => {
    let i = (d.year - filters.startYear) * 24 + d.hour;
    cells[i].count += d.count;
  });

  // Divide by the year's total to get the share
  years.forEach((year, row) => {
    let rowCells = cells.slice(row * 24, row * 24 + 24);
    let total = d3.sum(rowCells, d => d.count);
    rowCells.forEach(d => {
      d.yearTotal = total;
      d.share = total > 0 ? d.count / total : 0;
    });
  });

  // Baseline: share in each hour in 2016-2019 and 2021-2025.
  // We ignore the year filter so the baseline doesn't change when you zoom in.
  let allYears = filterData(allHourly, ['years']);
  heatmapPreShares = hourShares(allYears.filter(d => d.year <= 2019));
  let postShares = hourShares(allYears.filter(d => d.year >= 2021));

  updateHeatmapAxes(years);

  // Color scale. We leave 12 AM out of the max so its fake spike doesn't wash out the other hours.
  let maxShare = d3.max(cells.filter(d => d.hour !== 0), d => d.share) || 0.01;
  heatmapColor = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, maxShare])
    .clamp(true);

  // Draw the cells
  heatmapSvg.select('.cells')
    .selectAll('rect')
    .data(cells)
    .join('rect')
    .attr('x', d => heatmapX(d.hour))
    .attr('y', d => heatmapY(d.year))
    .attr('width', heatmapX.bandwidth())
    .attr('height', heatmapY.bandwidth())
    .style('fill', d => d.yearTotal > 0 ? heatmapColor(d.share) : '#eee')
    .on('mouseover', function (event, d) {
      d3.select(this).style('stroke', 'black').style('stroke-width', 2);

      let share = d.yearTotal > 0 ? d3.format('.1%')(d.share) : 'n/a';
      let pre = heatmapPreShares[d.hour];
      let compared = pre > 0 && d.yearTotal > 0 ? d3.format('+.0%')(d.share / pre - 1) : 'n/a';
      let warning = d.hour === 0 ? '<br/><em>Unreliable: unknown times are logged as 12 AM</em>' : '';

      showTooltip(event,
        `<strong>${d.year}, ${hourLabel(d.hour)}</strong><br/>
        Thefts: ${d3.format(',')(d.count)}<br/>
        Share of the year: ${share}<br/>
        Compared to 2016-2019 share: ${compared}${warning}`);
    })
    .on('mouseout', function () {
      d3.select(this).style('stroke', 'none');
      hideTooltip();
    });

  // Stripes over the 12 AM column
  heatmapSvg.select('.hatch').selectAll('*').remove();
  heatmapSvg.select('.hatch')
    .append('rect')
    .attr('x', heatmapX(0))
    .attr('y', 0)
    .attr('width', heatmapX.bandwidth())
    .attr('height', heatmapHeight)
    .style('fill', 'url(#heatmap-hatch)')
    .style('pointer-events', 'none'); // so the cells underneath still get the tooltip
  heatmapSvg.select('.hatch')
    .append('text')
    .attr('x', heatmapX(0) + heatmapX.bandwidth() / 2)
    .attr('y', -6)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .text('*');

  drawHeatmapPeriods(years);
  drawHeatmapLegend(maxShare);
  drawHeatmapAnnotation(postShares);

  d3.select('#heatmap-note').text(
    '* The 12 AM column is striped because it is not reliable: when nobody knows when a theft happened, ' +
    'it is usually recorded at 12:00 AM. The colors leave this column out.');
}

// Returns a list of 24 numbers: the share of thefts in each hour
function hourShares(rows) {
  let counts = heatmapHours.map(() => 0);
  rows.forEach(d => counts[d.hour] += d.count);
  let total = d3.sum(counts);
  return counts.map(c => total > 0 ? c / total : 0);
}

// 'bigger', 'smaller' or 'similar', for the caption
function biggerOrSmaller(before, after) {
  if (Math.abs(after - before) < 0.001) return 'similar';
  return after > before ? 'bigger' : 'smaller';
}

// Adds up the shares for hours start..end (inclusive)
function sumShares(shares, range) {
  return d3.sum(shares.slice(range[0], range[1] + 1));
}

function updateHeatmapAxes(years) {
  heatmapSvg.selectAll('.axis').remove();
  heatmapSvg.selectAll('.labels').remove();

  heatmapY = d3.scaleBand()
    .domain(years)
    .range([0, heatmapHeight])
    .padding(0.05);

  // X axis (label every 3 hours so they don't overlap)
  heatmapSvg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0, ${heatmapHeight})`)
    .call(d3.axisBottom(heatmapX)
      .tickValues(heatmapHours.filter(h => h % 3 === 0))
      .tickFormat(hourLabel));

  // Y axis
  heatmapSvg.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(heatmapY).tickFormat(d3.format('d')));

  // X-axis label
  heatmapSvg.append('text')
    .attr('class', 'labels')
    .attr('x', heatmapWidth / 2)
    .attr('y', heatmapHeight + 40)
    .attr('text-anchor', 'middle')
    .text('Hour of day');

  // Y-axis label (rotated)
  heatmapSvg.append('text')
    .attr('class', 'labels')
    .attr('transform', 'rotate(-90)')
    .attr('x', -heatmapHeight / 2)
    .attr('y', -heatmapMargin.left + 15)
    .attr('text-anchor', 'middle')
    .text('Year');
}

// Labels on the right side for before / 2020 / after, with a line between them
function drawHeatmapPeriods(years) {
  let group = heatmapSvg.select('.periods');
  group.selectAll('*').remove();

  let periods = [
    { name: 'Before', start: 2016, end: 2019, color: '#4C78A8' },
    { name: '2020', start: 2020, end: 2020, color: 'gray' },
    { name: 'After', start: 2021, end: 2025, color: '#E45756' }
  ];

  periods.forEach(p => {
    let shown = years.filter(y => y >= p.start && y <= p.end);
    if (shown.length === 0) return;

    let top = heatmapY(shown[0]);
    let bottom = heatmapY(shown[shown.length - 1]) + heatmapY.bandwidth();

    // Bracket line next to the rows
    group.append('line')
      .attr('x1', heatmapWidth + 8)
      .attr('x2', heatmapWidth + 8)
      .attr('y1', top + 1)
      .attr('y2', bottom - 1)
      .attr('stroke', p.color)
      .attr('stroke-width', 3);

    group.append('text')
      .attr('x', heatmapWidth + 14)
      .attr('y', (top + bottom) / 2 + 4)
      .style('font-size', '12px')
      .style('fill', p.color)
      .text(p.name);
  });
}

// Color legend below the x axis
function drawHeatmapLegend(maxShare) {
  let group = heatmapSvg.select('.legend');
  group.selectAll('*').remove();
  group.attr('transform', `translate(0, ${heatmapHeight + 60})`);

  let legendWidth = 200;
  group.append('text')
    .attr('x', 0)
    .attr('y', 12)
    .style('font-size', '12px')
    .text('Share of the year\'s thefts:');

  group.append('rect')
    .attr('x', 150)
    .attr('y', 0)
    .attr('width', legendWidth)
    .attr('height', 14)
    .style('fill', 'url(#heatmap-gradient)');

  let legendScale = d3.scaleLinear().domain([0, maxShare]).range([0, legendWidth]);
  group.append('g')
    .attr('class', 'axis')
    .attr('transform', 'translate(150, 14)')
    .call(d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format('.0%')));
}

// Annotation: bracket over the overnight hours, comparing their share before and after
function drawHeatmapAnnotation(postShares) {
  let group = heatmapSvg.select('.annotation');
  group.selectAll('*').remove();

  let preNight = sumShares(heatmapPreShares, heatmapNight);
  let postNight = sumShares(postShares, heatmapNight);
  let preAfternoon = sumShares(heatmapPreShares, heatmapAfternoon);
  let postAfternoon = sumShares(postShares, heatmapAfternoon);

  // hourShares() gives all zeros when there are no rows
  if (d3.sum(heatmapPreShares) === 0 || d3.sum(postShares) === 0) {
    d3.select('#heatmap-caption').text(
      'Each row shows how one year\'s thefts are spread over the day. ' +
      'There isn\'t enough data before and after 2020 for these filters to compare.');
    return;
  }

  let pct = d3.format('.1%');
  let left = heatmapX(heatmapNight[0]);
  let right = heatmapX(heatmapNight[1]) + heatmapX.bandwidth();

  // Bracket
  group.append('path')
    .attr('d', `M${left},-4 V-12 H${right} V-4`)
    .attr('fill', 'none')
    .attr('stroke', 'black');

  group.append('text')
    .attr('x', left)
    .attr('y', -18)
    .style('font-size', '12px')
    .text('1-5 AM: ' + pct(preNight) + ' of thefts before 2020, ' + pct(postNight) + ' after');

  // Caption with the main takeaway
  let nightWord = biggerOrSmaller(preNight, postNight);
  let afternoonWord = biggerOrSmaller(preAfternoon, postAfternoon);
  d3.select('#heatmap-caption').text(
    'Each row shows how one year\'s thefts are spread over the day. ' +
    'Since 2021, a ' + nightWord + ' share of thefts happen overnight (1-5 AM: ' +
    pct(preNight) + ' before vs ' + pct(postNight) + ' after) and a ' + afternoonWord +
    ' share happen in the afternoon (12-5 PM: ' + pct(preAfternoon) + ' vs ' + pct(postAfternoon) + ').');
}
