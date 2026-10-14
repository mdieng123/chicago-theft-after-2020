// controls.js (Person B)
// Shared controls: change filters, then redraw every view through updateAll().

function initControls() {
  const panel = d3.select('#controls');
  panel.selectAll('*').remove();

  function addSelect(id, label, options, key) {
    const group = panel.append('label').style('display', 'inline-block').style('margin', '0 14px 10px 0');
    group.append('span').text(label + ' ');
    group.append('select').attr('id', id)
      .selectAll('option').data(options).join('option')
      .attr('value', d => d).text(d => d);
    group.select('select').on('change', function () {
      filters[key] = this.value;
      updateAll();
    });
  }

  const years = d3.range(2016, 2026).map(String);
  addSelect('start-year', 'From year:', years, 'startYear');
  addSelect('end-year', 'To year:', years, 'endYear');
  // Years must stay numeric for filtering and brushing.
  panel.select('#start-year').on('change', function () {
    filters.startYear = Math.min(+this.value, filters.endYear);
    updateAll();
  });
  panel.select('#end-year').on('change', function () {
    filters.endYear = Math.max(+this.value, filters.startYear);
    updateAll();
  });

  const crimeGroup = panel.append('div').style('margin-bottom', '10px');
  [['showTheft', 'Theft'], ['showVehicle', 'Motor vehicle theft']].forEach(([key, label]) => {
    const wrapper = crimeGroup.append('label').style('margin-right', '18px');
    wrapper.append('input').attr('type', 'checkbox').attr('id', key)
      .on('change', function () {
        filters[key] = this.checked;
        updateAll();
      });
    wrapper.append('span').text(' ' + label);
  });

  addSelect('type-group', 'Theft type:', ['All'].concat(lookups.type_groups), 'typeGroup');
  addSelect('loc-group', 'Location:', ['All'].concat(lookups.loc_groups), 'locGroup');
  addSelect('city-side', 'City side:', ['All'].concat(lookups.sides), 'side');

  panel.append('div').append('button').text('Reset filters').on('click', resetFilters);
  panel.append('p').attr('id', 'summary').attr('aria-live', 'polite');
}

function updateControls(data) {
  // View 1 brushing and Reset can also change filters, so sync every input.
  d3.select('#start-year').property('value', filters.startYear);
  d3.select('#end-year').property('value', filters.endYear);
  d3.select('#showTheft').property('checked', filters.showTheft);
  d3.select('#showVehicle').property('checked', filters.showVehicle);
  d3.select('#type-group').property('value', filters.typeGroup);
  d3.select('#loc-group').property('value', filters.locGroup);
  d3.select('#city-side').property('value', filters.side);

  const total = d3.sum(data, d => d.count);
  d3.select('#summary').text('Showing ' + d3.format(',')(total) + ' thefts · ' +
    filters.startYear + '–' + filters.endYear + ' · ' +
    (filters.typeGroup === 'All' ? 'All theft types' : filters.typeGroup) + ' · ' +
    (filters.locGroup === 'All' ? 'All locations' : filters.locGroup) + ' · ' +
    (filters.side === 'All' ? 'All city sides' : filters.side));
}
