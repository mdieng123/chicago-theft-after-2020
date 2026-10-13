// View 1: monthly theft counts with period bands, the stay-at-home marker and the pre-2020 average.
// Owner: A. Hover snaps to the nearest month; dragging across the chart sets the year-range filter.
import { filters, setFilters, applyFilters } from './state.js';
import * as tooltip from './tooltip.js';

const margin = { top: 32, right: 24, bottom: 44, left: 64 };
const width = 900;
const height = 360;
const innerW = width - margin.left - margin.right;
const innerH = height - margin.top - margin.bottom;

// Illinois Executive Order 2020-10 (stay at home) took effect March 21, 2020.
const STAY_HOME = new Date(2020, 2, 21);

const fmtCount = d3.format(',');
const fmtShare = d3.format('.1%');
const fmtChange = d3.format('+.0%');
const fmtMonth = d3.timeFormat('%B %Y');

const PERIOD_LABELS = { pre: 'Before', covid: '2020', post: 'After' };

let allMonthly, lookups;
let x, y, series = [], total = 0, preAvg = 0;
let g, bandsG, gridG, xAxisG, yAxisG, avgG, stayG, linePath, focus, brush, brushG, caption;

const monthsIn = ([y0, y1]) => (y1 - y0 + 1) * 12;
const yearSpan = ([y0, y1]) => (y0 === y1 ? `${y0}` : `${y0}–${String(y1).slice(2)}`);

export function init(containerSelector, data, lk) {
  allMonthly = data.monthly;
  lookups = lk;
  caption = d3.select('#trend-caption');

  const svg = d3.select(containerSelector)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr('aria-label', 'Line chart of monthly thefts in Chicago');

  g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  bandsG = g.append('g').attr('class', 'bands');
  gridG = g.append('g').attr('class', 'grid');
  xAxisG = g.append('g').attr('class', 'axis x-axis').attr('transform', `translate(0,${innerH})`);
  yAxisG = g.append('g').attr('class', 'axis y-axis');
  linePath = g.append('path').attr('class', 'trend-line');
  avgG = g.append('g').attr('class', 'ref avg-ref');
  stayG = g.append('g').attr('class', 'ref stay-ref');

  g.append('text')
    .attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerH / 2)
    .attr('y', -margin.left + 16)
    .attr('text-anchor', 'middle')
    .text('Thefts per month');

  g.append('text')
    .attr('class', 'axis-label')
    .attr('x', innerW / 2)
    .attr('y', innerH + 38)
    .attr('text-anchor', 'middle')
    .text('Month');

  focus = g.append('g').attr('class', 'focus').style('display', 'none');
  focus.append('line').attr('class', 'crosshair').attr('y1', 0).attr('y2', innerH);
  focus.append('circle').attr('r', 4.5);

  // The brush overlay sits on top and doubles as the hover target for the tooltip.
  brush = d3.brushX().extent([[0, 0], [innerW, innerH]]).on('end', brushed);
  brushG = g.append('g').attr('class', 'brush').call(brush);
  brushG
    .on('pointermove', hover)
    .on('pointerleave', unhover)
    .on('pointerdown.hide', unhover);
}

export function update(filtered) {
  const [y0, y1] = filters.yearRange;

  // One point per month in the selected range, including months with zero thefts.
  const byMonth = d3.rollup(
    filtered.monthly,
    v => ({ count: d3.sum(v, d => d.count), arrests: d3.sum(v, d => d.arrests) }),
    d => d.year,
    d => d.month
  );
  series = d3.range(y0, y1 + 1).flatMap(year =>
    d3.range(1, 13).map(month => {
      const v = byMonth.get(year)?.get(month) ?? { count: 0, arrests: 0 };
      return { year, month, date: new Date(year, month - 1, 15), ...v };
    })
  );
  total = d3.sum(series, d => d.count);

  // Period averages ignore the year filter, so the baseline stays fixed while you zoom.
  const unzoomed = applyFilters(allMonthly, { ignore: ['yearRange'] });
  const periodAvg = p => d3.sum(unzoomed.filter(d => d.period === p), d => d.count) / monthsIn(lookups.periods[p]);
  preAvg = periodAvg('pre');
  const postAvg = periodAvg('post');

  x = d3.scaleTime().domain([new Date(y0, 0, 1), new Date(y1 + 1, 0, 1)]).range([0, innerW]);
  y = d3.scaleLinear()
    .domain([0, Math.max(d3.max(series, d => d.count), preAvg, 1) * 1.08])
    .nice()
    .range([innerH, 0]);

  drawBands();

  gridG.call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''))
    .call(sel => sel.select('.domain').remove());
  yAxisG.call(d3.axisLeft(y).ticks(5).tickFormat(fmtCount))
    .call(sel => sel.select('.domain').remove());

  const years = y1 - y0 + 1;
  const xAxis = years <= 2
    ? d3.axisBottom(x).ticks(d3.timeMonth.every(years === 1 ? 1 : 3)).tickFormat(d3.timeFormat('%b %Y'))
    : d3.axisBottom(x).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat('%Y'));
  xAxisG.call(xAxis);

  // Animate only when the months stay the same; tweening paths with different point counts scrambles the line.
  const line = d3.line().x(d => x(d.date)).y(d => y(d.count));
  const sameMonths = linePath.datum()?.length === series.length;
  linePath.datum(series);
  (sameMonths ? linePath.transition().duration(400) : linePath.interrupt()).attr('d', line);

  drawAverage();
  drawStayHome();

  caption.text(
    preAvg > 0
      ? `Before 2020 the city averaged ${fmtCount(Math.round(preAvg))} of these thefts a month; ` +
        `since 2021 it has averaged ${fmtCount(Math.round(postAvg))} (${fmtChange(postAvg / preAvg - 1)}).`
      : 'No thefts match the current filters before 2020, so there is no baseline to compare against.'
  );
}

function drawBands() {
  const [d0, d1] = x.domain();
  const bands = Object.entries(lookups.periods)
    .map(([key, [p0, p1]]) => ({
      key,
      x0: x(d3.max([d0, new Date(p0, 0, 1)])),
      x1: x(d3.min([d1, new Date(p1 + 1, 0, 1)])),
      label: key === 'covid' ? PERIOD_LABELS.covid : `${PERIOD_LABELS[key]} (${yearSpan([p0, p1])})`,
    }))
    .filter(b => b.x1 > b.x0);

  bandsG.selectAll('g.band')
    .data(bands, b => b.key)
    .join(enter => {
      const band = enter.append('g').attr('class', b => `band band-${b.key}`);
      band.append('rect').attr('y', 0).attr('height', innerH);
      band.append('text').attr('class', 'band-label').attr('y', -10).attr('text-anchor', 'middle');
      return band;
    })
    .call(band => band.select('rect').attr('x', b => b.x0).attr('width', b => b.x1 - b.x0))
    .call(band => band.select('text')
      .attr('x', b => (b.x0 + b.x1) / 2)
      .text(b => (b.x1 - b.x0 > 70 ? b.label : b.x1 - b.x0 > 36 ? PERIOD_LABELS[b.key] : '')));
}

function drawAverage() {
  const show = preAvg > 0;
  avgG.selectAll('*').remove();
  if (!show) return;
  const yy = y(preAvg);
  avgG.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', yy).attr('y2', yy);
  avgG.append('text')
    .attr('x', 6)
    .attr('y', yy + 16)
    .text(`2016–19 average: ${fmtCount(Math.round(preAvg))}/month`);
}

function drawStayHome() {
  stayG.selectAll('*').remove();
  const [d0, d1] = x.domain();
  if (STAY_HOME < d0 || STAY_HOME > d1) return;
  const xx = x(STAY_HOME);
  stayG.append('line').attr('x1', xx).attr('x2', xx).attr('y1', 0).attr('y2', innerH);
  stayG.append('text')
    .attr('x', xx + 6)
    .attr('y', 14)
    .text('Stay-at-home order, Mar 2020');
}

function nearest(event) {
  const [mx] = d3.pointer(event, g.node());
  const date = x.invert(mx);
  const i = d3.bisector(d => d.date).center(series, date);
  return series[i];
}

function hover(event) {
  if (event.buttons) return; // dragging the brush
  const d = nearest(event);
  if (!d) return;
  focus.style('display', null);
  focus.select('line').attr('x1', x(d.date)).attr('x2', x(d.date));
  focus.select('circle').attr('cx', x(d.date)).attr('cy', y(d.count));

  tooltip.show(event, {
    title: fmtMonth(d.date),
    rows: [
      ['Thefts', fmtCount(d.count)],
      ['Share of selection', total ? fmtShare(d.count / total) : '–'],
      ['vs 2016–19 monthly avg', preAvg ? fmtChange(d.count / preAvg - 1) : '–'],
      ['Arrest rate', d.count ? fmtShare(d.arrests / d.count) : '–'],
    ],
  });
}

function unhover() {
  focus.style('display', 'none');
  tooltip.hide();
}

// Dragging selects whole years and sets the shared year range; the brush then clears itself.
function brushed({ selection, sourceEvent }) {
  if (!sourceEvent || !selection) return;
  brushG.call(brush.move, null);
  const [a, b] = selection.map(x.invert);
  const [y0, y1] = filters.yearRange;
  const from = Math.max(y0, a.getFullYear());
  const to = Math.min(y1, new Date(b - 1).getFullYear());
  if (from === y0 && to === y1) return;
  setFilters({ yearRange: [from, to] });
}
