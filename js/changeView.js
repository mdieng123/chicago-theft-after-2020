// changeView.js (Person B)
// Diverging bars compare average ANNUAL theft counts: 2016–19 vs 2021–25.

const changeMargin = { top: 35, right: 75, bottom: 60, left: 165 };
const changeWidth = 800 - changeMargin.left - changeMargin.right;
const changeHeight = 370 - changeMargin.top - changeMargin.bottom;
let changeSvg;
let changeMode = 'type_group';

function initChange() {
  const view = d3.select('#view-change');
  view.selectAll('*').remove();
  const switcher = view.append('label').text('Compare by: ');
  switcher.append('select').attr('id', 'change-mode')
    .selectAll('option').data([
      { value: 'type_group', label: 'Theft type' },
      { value: 'loc_group', label: 'Location type' }
    ]).join('option')
    .attr('value', d => d.value).text(d => d.label);
  switcher.select('select').on('change', function () {
    changeMode = this.value;
    updateChange();
  });

  changeSvg = view.append('svg')
    .attr('width', 800).attr('height', 370)
    .append('g').attr('transform', `translate(${changeMargin.left},${changeMargin.top})`);
  changeSvg.append('g').attr('class', 'change-x-axis')
    .attr('transform', `translate(0,${changeHeight})`);
  changeSvg.append('g').attr('class', 'change-y-axis');
  changeSvg.append('line').attr('class', 'change-zero').attr('stroke', '#555').attr('stroke-dasharray', '3,3');
  changeSvg.append('g').attr('class', 'change-bars');
  changeSvg.append('g').attr('class', 'change-labels');
  changeSvg.append('text').attr('class', 'change-axis-title')
    .attr('x', changeWidth / 2).attr('y', changeHeight + 48)
    .attr('text-anchor', 'middle').text('Change in average annual thefts (%)');
}

function updateChange() {
  // Ignore years so the 2016–19 baseline survives a brush/zoom.
  // Ignore the currently displayed group so clicking a bar doesn't hide the others.
  const ignore = ['years', changeMode === 'type_group' ? 'typeGroup' : 'locGroup'];
  const rows = filterData(allMonthly, ignore);
  const names = changeMode === 'type_group' ? lookups.type_groups : lookups.loc_groups;
  const result = names.map(name => {
    const subset = rows.filter(d => d[changeMode] === name);
    const preRows = subset.filter(d => d.year >= 2016 && d.year <= 2019);
    const postRows = subset.filter(d => d.year >= 2021 && d.year <= 2025);
    const preCount = d3.sum(preRows, d => d.count);
    const postCount = d3.sum(postRows, d => d.count);
    const pre = preCount / 4;
    const post = postCount / 5;
    return {
      name, pre, post, preCount, postCount,
      preArrests: d3.sum(preRows, d => d.arrests),
      postArrests: d3.sum(postRows, d => d.arrests),
      change: pre > 0 ? post / pre - 1 : null
    };
  }).sort((a, b) => (a.change === null ? Infinity : a.change) - (b.change === null ? Infinity : b.change));

  const valid = result.filter(d => d.change !== null);
  const extent = d3.extent(valid, d => d.change);
  const limit = Math.max(0.1, Math.abs(extent[0] || 0), Math.abs(extent[1] || 0));
  const x = d3.scaleLinear().domain([-limit * 1.1, limit * 1.1]).range([0, changeWidth]);
  const y = d3.scaleBand().domain(result.map(d => d.name)).range([0, changeHeight]).padding(0.22);
  const fmt = d3.format('+.0%');
  const selected = changeMode === 'type_group' ? filters.typeGroup : filters.locGroup;

  changeSvg.select('.change-x-axis').call(d3.axisBottom(x).ticks(6).tickFormat(d3.format('+.0%')));
  changeSvg.select('.change-y-axis').call(d3.axisLeft(y));
  changeSvg.select('.change-zero').attr('x1', x(0)).attr('x2', x(0))
    .attr('y1', 0).attr('y2', changeHeight);

  changeSvg.select('.change-bars').selectAll('rect').data(result, d => d.name)
    .join('rect')
    .attr('x', d => x(Math.min(0, d.change === null ? 0 : d.change)))
    .attr('y', d => y(d.name))
    .attr('width', d => Math.abs(x(d.change === null ? 0 : d.change) - x(0)))
    .attr('height', y.bandwidth())
    .attr('fill', d => d.change >= 0 ? '#E45756' : '#4C78A8')
    .attr('stroke', d => selected === d.name ? '#222' : 'none')
    .attr('stroke-width', 3)
    .style('cursor', 'pointer')
    .on('click', function (event, d) {
      const key = changeMode === 'type_group' ? 'typeGroup' : 'locGroup';
      filters[key] = filters[key] === d.name ? 'All' : d.name;
      hideTooltip();
      updateAll();
    })
    .on('mouseover', function (event, d) {
      const preRate = d.preCount ? d3.format('.1%')(d.preArrests / d.preCount) : 'n/a';
      const postRate = d.postCount ? d3.format('.1%')(d.postArrests / d.postCount) : 'n/a';
      showTooltip(event, '<strong>' + d.name + '</strong><br/>' +
        '2016–19 annual average: ' + d3.format(',.0f')(d.pre) + '<br/>' +
        '2021–25 annual average: ' + d3.format(',.0f')(d.post) + '<br/>' +
        'Change: ' + (d.change === null ? 'n/a (zero baseline)' : fmt(d.change)) + '<br/>' +
        'Arrest rate (before / after): ' + preRate + ' / ' + postRate);
    })
    .on('mouseout', hideTooltip);

  changeSvg.select('.change-labels').selectAll('text').data(result, d => d.name)
    .join('text')
    .attr('x', d => x(d.change === null ? 0 : d.change) + (d.change >= 0 ? 5 : -5))
    .attr('y', d => y(d.name) + y.bandwidth() / 2 + 4)
    .attr('text-anchor', d => d.change >= 0 ? 'start' : 'end')
    .attr('font-size', 11)
    .text(d => d.change === null ? 'n/a' : fmt(d.change));

  const biggest = valid.reduce((best, d) => !best || d.change > best.change ? d : best, null);
  d3.select('#change-caption').text(biggest
    ? 'Comparing average annual thefts in 2016–2019 with 2021–2025 (excluding 2020). ' +
      biggest.name + ' has the largest increase (' + fmt(biggest.change) + '). Click a bar to filter all views; click again to clear.'
    : 'No thefts match the selected filters. Try Reset filters.');
}
