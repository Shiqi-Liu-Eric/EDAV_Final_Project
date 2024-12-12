
function createSeededRandom(seed) {
  return function() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

Promise.all([
  d3.csv("flight_NYC_2023_08.csv"),
  d3.csv("flight_NYC_2023_12.csv"),
  d3.csv("weather_NYC_2023.csv")
]).then(function (datasets) {
  const dataAugust = datasets[0];
  const dataDecember = datasets[1];
  const dataWeather = datasets[2];

  dataWeather.forEach(d => d.datetime = new Date(d.datetime));

  function addWeatherInfo(flightData, weatherData) {
    return flightData.map(flight => {
      const flightDate = new Date(flight.YEAR, flight.MONTH - 1, flight.DAY_OF_MONTH);
      const weather = weatherData.find(w => {
        const weatherDate = new Date(w.datetime);
        return weatherDate.getFullYear() === flightDate.getFullYear() &&
          weatherDate.getMonth() === flightDate.getMonth() &&
          weatherDate.getDate() === flightDate.getDate();
      });
      flight.weather = weather ? weather.icon : "clear-day";
      flight.ARR_DELAY = +flight.ARR_DELAY;
      flight.DEP_DELAY = +flight.DEP_DELAY;
      flight.DISTANCE = +flight.DISTANCE;

      const weatherCodes = {
        "clear-day": 0,
        "partly-cloudy-day": 1,
        "cloudy": 2,
        "rain": 3,
        "snow": 4
      };
      flight.weather_code = weatherCodes[flight.weather] || 0;

      return flight;
    });
  }

  const dataAugustWithWeather = addWeatherInfo(dataAugust, dataWeather)
    .filter(d => ["New York, NY", "Newark, NJ"].includes(d.ORIGIN_CITY_NAME));
  const dataDecemberWithWeather = addWeatherInfo(dataDecember, dataWeather)
    .filter(d => ["New York, NY", "Newark, NJ"].includes(d.ORIGIN_CITY_NAME));

  let data = dataAugustWithWeather.concat(dataDecemberWithWeather).map(function (d, i) {
    d.month = i < dataAugustWithWeather.length ? "August" : "December";
    return d;
  });

  
  let seedRng = createSeededRandom(1234);
  data.forEach(d => {
    d.randVal = seedRng();
  });

  createBubbleChart(data);
});

function createBubbleChart(data) {
  const margin = { top: 50, right: 50, bottom: 50, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;


  let samplingRate = 0.2;

  const svg = d3.select("#bubbleChart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.ARR_DELAY), d3.max(data, d => d.ARR_DELAY)])
    .range([height, 0]);

  let xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => calculateXValue(d, 0.5, 0.1, 125))])
    .range([0, width]);

  const sizeScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.DISTANCE)])
    .range([2, 8]);

  const colorScale = d3.scaleOrdinal()
    .domain(["clear-day", "partly-cloudy-day", "cloudy", "rain"])
    .range(["#e41a1c", "#377eb8", "#4daf4a", "#0000aa"]);

  let xAxis = svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale));

  const yAxis = svg.append("g")
    .call(d3.axisLeft(yScale));

  svg.append("text")
    .attr("class", "x-label")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + 30)
    .text("Weighted Value");

  svg.append("text")
    .attr("class", "y-label")
    .attr("text-anchor", "end")
    .attr("x", -30) 
    .attr("y", -50)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Arrival Delay (minutes)");

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  function updateChart(filteredData, weight1, weight2, weight3) {
   
    const sampledData = filteredData.filter(d => d.randVal < samplingRate);

    xScale.domain([0, d3.max(sampledData, d => calculateXValue(d, weight1, weight2, weight3)) || 0]);
    xAxis.transition().duration(500).call(d3.axisBottom(xScale));

    const bubbles = svg.selectAll(".bubble")
      .data(sampledData, d => d.FL_DATE + d.ORIGIN + d.DEST);

    bubbles.exit()
      .transition()
      .duration(500)
      .attr("r", 0)
      .remove();

    bubbles.enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("cx", d => xScale(calculateXValue(d, weight1, weight2, weight3)))
      .attr("cy", d => yScale(d.ARR_DELAY))
      .attr("r", 0)
      .style("fill", d => colorScale(d.weather))
      .on("mouseover", function (event, d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(`<strong>Date:</strong> ${d.FL_DATE}<br>
                      <strong>Origin:</strong> ${d.ORIGIN}<br>
                      <strong>Destination:</strong> ${d.DEST}<br>
                      <strong>Distance:</strong> ${d.DISTANCE} miles<br>
                      <strong>Weather:</strong> ${d.weather}<br>
                      <strong>Weather Code:</strong> ${d.weather_code}<br> 
                      <strong>Departure Delay:</strong> ${d.DEP_DELAY} minutes<br>
                      <strong>Arrival Delay:</strong> ${d.ARR_DELAY} minutes`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      })
      .transition()
      .duration(500)
      .attr("r", d => sizeScale(d.DISTANCE));

    bubbles
      .transition()
      .duration(500)
      .attr("cx", d => xScale(calculateXValue(d, weight1, weight2, weight3)))
      .attr("cy", d => yScale(d.ARR_DELAY))
      .attr("r", d => sizeScale(d.DISTANCE));
  }

  function calculateXValue(d, weight1, weight2, weight3) {
    return weight1 * d.DEP_DELAY + weight2 * d.DISTANCE + weight3 * d.weather_code;
  }

 
  updateChart(data, 0.5, 0.1, 125);

  d3.select("#originSelect").on("change", function () {
    const selectedOrigin = this.value;
    const filteredData = selectedOrigin === "all"
      ? data
      : data.filter(d => d.ORIGIN === selectedOrigin);
    updateChart(filteredData, +d3.select("#weight1").property("value"), 
                           +d3.select("#weight2").property("value"), 
                           +d3.select("#weight3").property("value"));
  });

  d3.select("#weight1").on("input", function () {
    d3.select("#weight1Value").text(this.value);
    const selectedOrigin = d3.select("#originSelect").property("value");
    const filteredData = selectedOrigin === "all" ? data : data.filter(d => d.ORIGIN === selectedOrigin);
    updateChart(filteredData, +this.value, 
                           +d3.select("#weight2").property("value"), 
                           +d3.select("#weight3").property("value"));
  });

  d3.select("#weight2").on("input", function () {
    d3.select("#weight2Value").text(this.value);
    const selectedOrigin = d3.select("#originSelect").property("value");
    const filteredData = selectedOrigin === "all" ? data : data.filter(d => d.ORIGIN === selectedOrigin);
    updateChart(filteredData, +d3.select("#weight1").property("value"), 
                           +this.value, 
                           +d3.select("#weight3").property("value"));
  });

  d3.select("#weight3").on("input", function () {
    d3.select("#weight3Value").text(this.value);
    const selectedOrigin = d3.select("#originSelect").property("value");
    const filteredData = selectedOrigin === "all" ? data : data.filter(d => d.ORIGIN === selectedOrigin);
    updateChart(filteredData, +d3.select("#weight1").property("value"), 
                           +d3.select("#weight2").property("value"), 
                           +this.value);
  });

  
  d3.select("#sampling").on("input", function () {
    samplingRate = +this.value;
    d3.select("#samplingValue").text(this.value);
    const selectedOrigin = d3.select("#originSelect").property("value");
    const filteredData = selectedOrigin === "all" ? data : data.filter(d => d.ORIGIN === selectedOrigin);
    updateChart(filteredData, +d3.select("#weight1").property("value"), 
                           +d3.select("#weight2").property("value"), 
                           +d3.select("#weight3").property("value"));
  });

  const legend = d3.select("#legend");
  const legendItems = legend.selectAll(".legend-item")
    .data(colorScale.domain())
    .enter()
    .append("div")
    .attr("class", "legend-item");

  legendItems.append("div")
    .attr("class", "legend-color")
    .style("background-color", d => colorScale(d));

  legendItems.append("span")
    .text(d => d);
}