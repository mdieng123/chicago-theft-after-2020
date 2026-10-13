// main.js (Person A)
// Loads the data and starts all the charts.

function init() {
  Promise.all([
    d3.csv('./data/theft_monthly.csv', d3.autoType), // autoType turns number columns into numbers
    d3.csv('./data/theft_hourly.csv', d3.autoType),
    d3.json('./data/lookups.json')
  ])
    .then(([monthly, hourly, lk]) => {
      lookups = lk;

      // Add the primary type (THEFT or MOTOR VEHICLE THEFT) to each row
      // so the Theft / Motor vehicle checkboxes can filter on it
      monthly.forEach(d => d.primary = lookups.type_primary[d.type_group]);
      hourly.forEach(d => d.primary = lookups.type_primary[d.type_group]);

      allMonthly = monthly;
      allHourly = hourly;
      console.log('Loaded', allMonthly.length, 'monthly rows and', allHourly.length, 'hourly rows');

      initControls();
      initTrend();
      initChange();
      initHeatmap();

      updateAll();
    })
    .catch(error => console.error('Error loading data:', error));
}

window.addEventListener('load', init);
