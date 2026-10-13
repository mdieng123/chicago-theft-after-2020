// Specify margins
const margin = {top: 80, right: 60, bottom: 60, left: 100}; 
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom; 

// Global variables
let allData = []
let xVar = 'income', yVar = 'lifeExp', sizeVar = 'population', targetYear = 2000
let xScale, yScale, sizeScale
const t = 1000; // 1000ms = 1 second

// Colors to represent by continents 
const continents = ['Africa', 'Asia', 'Oceania', 'Americas', 'Europe']
const colorScale = d3.scaleOrdinal(continents, d3.schemeSet2); // d3.schemeSet2 is a set of predefined colors. 

// Drop down options
const options = ['income', 'lifeExp', 'gdp', 'population', 'childDeaths']

// Create SVG
const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Loading Data
function init(){
    d3.csv("./data/gapminder_subset.csv"
        , 
    // This is the callback function, applied to each item in the array
    function(d){
        return {  
        // Besides converting the types, It also simpilify the variable names here. 
        country: d.country,
        continent: d.continent,
        year: +d.year, // using + to convert to numbers; same below
        lifeExp: +d.life_expectancy, 
        income: +d.income_per_person, 
        gdp: +d.gdp_per_capita, 
        childDeaths: +d.number_of_child_deaths,
        population: +d.population
     }
    })
    .then(data => {
            console.log(data)
            allData = data // Save the processed data in allData variable
            setupSelector()

            updateAxes()
            updateVis()
            addLegend()
        })
    .catch(error => console.error('Error loading data:', error));
}

window.addEventListener('load', init);

// Here’s what each function is responsible for:
function setupSelector(){
  // Handles UI changes (sliders, dropdowns)
  // Anytime the user tweaks something, this function reacts.
  // May need to call updateAxes() and updateVis() here when needed!
    let slider = d3
        .sliderHorizontal()
        .min(d3.min(allData.map(d => +d.year))) // setup the range
        .max(d3.max(allData.map(d => +d.year))) // setup the range
        .step(1)
        .width(width)  // Widen the slider if needed
        .displayValue(false)
        .default(targetYear)
        .on('onchange', (val) => {
            d3.select('#value').text(val);
            targetYear = +val // Update the year
            updateVis() // Refresh the chart
        });

    d3.select('#slider')
        .append('svg')
        .attr('width', width)  // Adjust width if needed
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)')
        .call(slider);


    d3.selectAll('.variable')
    // loop over each dropdown button
      .each(function() {
          d3.select(this).selectAll('myOptions')
          .data(options)
          .enter()
          .append('option')
          .text(d => d) // The displayed text
          .attr("value",d => d) // The actual value used in the code
  })
  d3.select('#xVariable').property('value', xVar)
  d3.select('#yVariable').property('value', yVar)
  d3.select('#sizeVariable').property('value', sizeVar)

//   Default target year
  slider.default = function (_) {
    if (!arguments.length) {
      if (defaultValue.length === 1) {
        return defaultValue[0];
      }

      return defaultValue;
    }

    var toArray = Array.isArray(_) ? _ : [_];

    toArray.sort(function (a, b) {
      return a - b;
    });

    defaultValue = toArray;
    value = toArray;
    return slider;
  };
  
  // Drop down updates 
  d3.selectAll('.variable')
    .each(function() {
        // Initialize each dropdown
        const dropdown = d3.select(this);
        const id = dropdown.property("id");

        if (id === "xVariable") {
            dropdown.property("value", xVar);
        }
        else if (id === "yVariable") {
            dropdown.property("value", yVar);
        }
        else if (id === "sizeVariable") {
            dropdown.property("value", sizeVar);
        }
    })

    .on("change", function (event) {
        const id = d3.select(this).property("id");
        const value = d3.select(this).property("value");
        
         // identify which dropdown was changed
        console.log(d3.select(this).property("id"))
        console.log(d3.select(this).property("value")) 

        //  Map to global variables
         if (id === "xVariable") {
            xVar = value;
        }
        else if (id === "yVariable") {
            yVar = value;
        }
        else if (id === "sizeVariable") {
            sizeVar = value;
        } 
        // update chart
        updateAxes();
        updateVis();
    })
}

function updateAxes(){
  svg.selectAll('.axis').remove()
  svg.selectAll('.labels').remove()

    // Draws the x-axis and y-axis
  xScale = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d[xVar])])
    .range([0, width]);
  const xAxis = d3.axisBottom(xScale)

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${height})`) // Position at the bottom
    .call(xAxis);

  // Y axis
  yScale = d3.scaleLinear()
    .domain([0, d3.max(allData, d => d[yVar])])
    .range([height, 0])

  const yAxis = d3.axisLeft(yScale)
     
  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0, 0)`)
    .call(yAxis)

  sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(allData, d => d[sizeVar])]) // Largest bubble = largest data point 
    .range([5, 20]); 

   // X-axis label
  svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 20)
      .attr("text-anchor", "middle")
      .text(xVar) // Displays the current x-axis variable
      .attr('class', 'labels')

  // Y-axis label (rotated)
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 40)
      .attr("text-anchor", "middle")
      .text(yVar) // Displays the current y-axis variable
      .attr('class', 'labels')
}

function updateVis(){
  // Filter data for the current year
  let currentData = allData.filter(d => d.year === targetYear)

  // Draws (or updates) the bubbles
  svg.selectAll('.points')
    .data(currentData, d => d.country)
    .join(
        // When we have new data points
        function(enter){
            return enter
                .append('circle')
                //...
                .on('mouseover', function (event, d) {
                    // console.log(d) // See the data point in the console for debugging
                    d3.select('#tooltip')
                        .style("display", 'block') // Make the tooltip visible
                        .html( // Change the html content of the <div> directly
                        `<strong>${d.country}</strong><br/>
                        Continent: ${d.continent}`)
                        .style("left", (event.pageX + 20) + "px")
                        .style("top", (event.pageY - 28) + "px");

                    d3.select(this) // Refers to the hovered circle
                        .style('stroke', 'black')
                        .style('stroke-width', '4px');
                })
                .on("mouseout", function (event, d) {
                    d3.select('#tooltip')
                    .style('display', 'none') // Hide tooltip when cursor leaves
                })
                .attr('class', 'points')
                .attr('cx', d => xScale(d[xVar]))
                .attr('cy', d => yScale(d[yVar]))
                .style('fill', d => colorScale(d.continent))
                .style('opacity', .5)
                .attr('r', 0) // before transition r = 0
                .transition(t) // Animate the transition
                .attr('r', d => sizeScale(d[sizeVar])) // Expand to target size
        },
        // Update existing points when data changes
        function(update){
            return update
                .transition(t)
                .attr('cx', d => xScale(d[xVar]))
                .attr('cy', d => yScale(d[yVar]))
                .attr('r', d => sizeScale(d[sizeVar]))
        },
        // Remove points that no longer exist in the filtered data 
        function(exit){
            exit
            .transition(t)
            .attr('r', 0)  // Shrink to radius 0
            .remove()  // Then remove the bubble
        }
    )
 
}

function addLegend(){
 // Adds a legend so users can decode colors
 let size = 10  // Size of the legend squares

  // Set of rectangles using D3
  svg.selectAll('continentSquare')
    .data(continents)
    .join('rect')
    .attr('class', 'continentSquare')
    .attr('width', size)
    .attr('height', size)
    .attr('x', (d, i) => i * (size + 100) + 100)
    .attr('y', -margin.top / 2)
    .style('fill', d => colorScale(d));

   // Adding labels
     svg.selectAll("continentName")
        .data(continents)
        .enter()
        .append("text")
        .attr("y", -margin.top/2 + size) // Align vertically with the square
        .attr("x", (d, i) => i * (size + 100) + 120)  
        .style("fill", d => colorScale(d))  // Match text color to the square
        .text(d => d) // The actual continent name
        .attr("text-anchor", "left")
        .style('font-size', '13px')
}