// state.js (Person A)
// The data and filters that all the charts share.

// All the data (main.js fills these in after loading the files)
let allMonthly = [];
let allHourly = [];
let lookups = {};

// Filter settings. 'All' means don't filter on that.
const defaultFilters = {
  startYear: 2016,
  endYear: 2025,
  showTheft: true,
  showVehicle: true,
  typeGroup: 'All',
  locGroup: 'All',
  side: 'All'
};
let filters = { ...defaultFilters };

// Returns only the rows that match the current filters.
// ignore (optional): the name of one filter to skip.
//   'years'     -> used by View 1 for the 2016-19 average, so it doesn't change when you zoom
//   'typeGroup' -> used by View 2 so it can still show every type bar
//   'locGroup'  -> same idea for the location bars
function filterData(rows, ignore) {
  return rows.filter(d => {
    if (ignore !== 'years' && (d.year < filters.startYear || d.year > filters.endYear)) return false;
    if (d.primary === 'THEFT' && !filters.showTheft) return false;
    if (d.primary === 'MOTOR VEHICLE THEFT' && !filters.showVehicle) return false;
    if (ignore !== 'typeGroup' && filters.typeGroup !== 'All' && d.type_group !== filters.typeGroup) return false;
    if (ignore !== 'locGroup' && filters.locGroup !== 'All' && d.loc_group !== filters.locGroup) return false;
    if (filters.side !== 'All' && d.side !== filters.side) return false;
    return true;
  });
}

// Call this after changing any filter. It redraws every chart.
function updateAll() {
  const monthly = filterData(allMonthly);
  const hourly = filterData(allHourly);

  updateControls(monthly);
  updateTrend(monthly);
  updateChange(monthly);
  updateHeatmap(hourly);
}

function resetFilters() {
  filters = { ...defaultFilters };
  updateAll();
}
