// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
 
    // Create the SVG container
    const svg = d3.select("#boxplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);    

    // Add scales     
    const xScale = d3.scaleBand()
        .domain([...new Set(data.map(d => d.AgeGroup))])
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Likes)])
        .range([height, 0]);

    // Add x-axis/y-axis label & axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .style("text-anchor", "middle")
        .text("Age Group");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .style("text-anchor", "middle")
        .text("Number of Likes");

    
    // Rollup Function
    const rollupFunction = function(groupData) {
      const values = groupData.map(d => d.Likes).sort(d3.ascending);
      const q1 = d3.quantile(values, 0.25);
      const median = d3.quantile(values, 0.5);
      const q3 = d3.quantile(values, 0.75);
      const iqr = q3 - q1;
      const min = d3.min(values);
      const max = d3.max(values);
      return { q1, median, q3, iqr, min, max };
  };

    // This code groups the dataset by 'AgeGroup' and applies 'rollupFunction' to each group,
    // creating a Map where each key is an AgeGroup and each value is the computed result
    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.AgeGroup);

    // Iterates over each AgeGroup in the Map 'quantilesByGroups', retrieving its quantile values,
    // and computes the x-position and box width for each group using the xScale for to plot
    quantilesByGroups.forEach((quantiles, AgeGroup) => {
        const x = xScale(AgeGroup);
        const boxWidth = xScale.bandwidth();

        // Draw vertical lines
        svg.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(quantiles.min))
            .attr("y2", yScale(quantiles.max))
            .attr("stroke", "black");

        // Draw box
        svg.append("rect")
            .attr("x", x)
            .attr("y", yScale(quantiles.q3))
            .attr("width", boxWidth)
            .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
            .attr("fill", "#aad8d3")
            .attr("stroke", "black");

        // Draw median line
        svg.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScale(quantiles.median))
            .attr("y2", yScale(quantiles.median))
            .attr("stroke", "red")
            .attr("stroke-width", 2);
    });
});

// Prepare you data and load the data again. 
// This data should contains three columns, platform, post type and average number of likes. 
const socialMediaAvg = d3.csv("SocialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(d => {
        d.AvgLikes = +d.AvgLikes; 
    });
    
    // Define the dimensions and margins for the SVG
    const margin = { top: 20, right: 150, bottom: 50, left: 60 };
    const width  = 700 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#barplot")
        .append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into parts
    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    // Recommend to add more spaces for the y scale for the legend
    // Also need a color scale for the post type

    const platforms = [...new Set(data.map(d => d.Platform))];
    const x0 = d3.scaleBand()
        .domain(platforms)
        .range([0, width])
        .paddingInner(0.2);
      
    const postTypes = [...new Set(data.map(d => d.PostType))];
    const x1 = d3.scaleBand()
        .domain(postTypes)
        .range([0, x0.bandwidth()])
        .padding(0.1);
      
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes) * 1.2])
        .nice()
        .range([height, 0]);
      
    const color = d3.scaleOrdinal()
      .domain(postTypes)
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    
  
    // Add scales x0 and y     
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text("Platform");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .style("text-anchor", "middle")
        .text("Average Likes");

    // Group container for bars
    const platformGroups = svg.selectAll(".platform-group")
        .data(platforms)
        .enter()
        .append("g")
        .attr("class", "platform-group")
        .attr("transform", d => `translate(${x0(d)},0)`);

    // Draw bars
    platformGroups.selectAll("rect")
        .data(platform => data.filter(d => d.Platform === platform))
        .enter()
        .append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AvgLikes))
        .attr("width",  x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes))
        .attr("fill",   d => color(d.PostType))
        .append("title") 
        .text(d => `${d.Platform} - ${d.PostType}: ${d.AvgLikes.toFixed(2)} Likes`);

    // Add the legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 10)`);

    const types = [...new Set(data.map(d => d.PostType))];
 
    types.forEach((type, i) => {
        // Already have the text information for the legend. 
        // Now add a small square/rect bar next to the text with different color.
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 22)
            .attr("width", 14)
            .attr("height", 14)
            .attr("fill", color(type));

        legend.append("text")
            .attr("x", 20)
            .attr("y", i * 22 + 11)
            .attr("alignment-baseline", "middle")
            .text(type);
    });
});


// Prepare you data and load the data again. 
// This data should contains two columns, date (3/1-3/7) and average number of likes. 

const socialMediaTime = d3.csv("SocialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values to numbers
    const parseDate = d3.timeParse("%m/%d/%Y (%A)");
    const formatDate = d3.timeFormat("%B %-d"); 

    data.forEach(d => {
        d.Date = parseDate(d.Date);
        d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 40, right: 30, bottom: 70, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom;


    // Create the SVG container
    const svg = d3.select("#lineplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    // Set up scales for x and y axes
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, width]);


    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .nice()
        .range([height, 0]);  

    // Draw the axis, you can rotate the text in the x-axis here
    const xAxis = d3.axisBottom(x)
        .ticks(data.length)
        .tickFormat(formatDate);


    const yAxis = d3.axisLeft(y).ticks(6);
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-25)");
    
    
    svg.append("g").call(yAxis);
    
    
    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 55)
        .attr("text-anchor", "middle")
        .text("Date");
    
    
    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Average Likes");
    
    
    // Draw the line and path using curveNatural
    const line = d3.line()
        .x(d => x(d.Date))
        .y(d => y(d.AvgLikes))
        .curve(d3.curveNatural);
    
    
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
});
