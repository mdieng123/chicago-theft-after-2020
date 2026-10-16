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
  typeGroup: 'All',
  locGroup: 'All', // set by clicking a bar in View 2 (location mode)
  side: 'All'
};
let filters = { ...defaultFilters };

// Returns only the rows that match the current filters.
// ignore (optional): a list of filters to skip, for example:
//   ['years']              -> View 1 uses this for the 2016-19 average, so it doesn't change when you zoom
//   ['years', 'typeGroup'] -> View 2 can use this to compare before vs after and still show every type bar
function filterData(rows, ignore = []) {
  return rows.filter(d => {
    if (!ignore.includes('years') && (d.year < filters.startYear || d.year > filters.endYear)) return false;
    if (!ignore.includes('typeGroup') && filters.typeGroup !== 'All' && d.type_group !== filters.typeGroup) return false;
    if (!ignore.includes('locGroup') && filters.locGroup !== 'All' && d.loc_group !== filters.locGroup) return false;
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
