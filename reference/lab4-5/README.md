# Gapminder Interactive Visualization 

## Project Overview 
This project uses the Gapminder dataset to create an interactive visualization of global development indicators using D3.js. Users can explore relationships between variables such as GDP, life expectancy, income per person, and the number of child deaths by selecting different variables for the X and Y axes. Each bubble represents a country, with its size indicating population and its color representing the continent. A year slider allows user to explore how these indicators change over time.

## Features 
- Dropdown menus: Users can explore different development indicators by selecting variables for the X and Y axes.
- Year slider: Users can explore how development indicators change over time
- Interactive tooltips: Users can hover over bubbles to view information about each country, including its name and continent. 
- Continent legend: Users can refere to the color coded lenged to identify which continent each bubble represents 

## Technologies Used
- JavaScript: implements the interactive functionality. 
- D3.js: Creates and updates the data visualization.
- HTML: Defines the webpage structure.
- CSS: Styles the webpage and visualization.

## Project Structure 
```text
|   index.html
|   README.md
|
+---css
|       styles.css
|
+---data
|       gapminder_subset.csv
|
+---js
|       script.js
|
+-- images        
|       gapminder.png
```

## How to Run
- Download the project from GitHub to your computer 
- Open the project folder in Visual Studio Code (VS Code)
- Right-click index.html and select **Open with Live Server**, or click **Go Live** at the bottom of VS Code

## Screenshot
![Gapminder Data Visualization](images/gapminder.png)
