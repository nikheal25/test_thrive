  function hslToRgb(h, s, l)
  {
      var r, g, b;
  
      if (s === 0)
      {
          r = g = b = l; // achromatic
      }
      else
      {
          function hue2rgb(p, q, t)
          {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1 / 6) return p + (q - p) * 6 * t;
              if (t < 1 / 2) return q;
              if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
              return p;
          }
  
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
  
          r = hue2rgb(p, q, h + 1 / 3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1 / 3);
      }
      // //console.log(r,g,b);
      r = Math.max(0, Math.min(Math.round(r * 255), 255));
      g = Math.max(0, Math.min(Math.round(g * 255), 255)) 
      b = Math.max(0, Math.min(Math.round(b * 255), 255)) 
      
      r = r < 16 ? "0" + r.toString(16) : r.toString(16);
      g = g < 16 ? "0" + g.toString(16) : g.toString(16);
      b = b < 16 ? "0" + b.toString(16) : b.toString(16);
  
      return "#" + r + g + b;
  }
    
  // Returns json data with functions.
  function create_hue_and_arr_data(score_data){
    // Firstly, create a color hue.
    var score_accum_arr = [];
    var total = 0;
    // score_accum_arr.push(total)
    score_data.forEach(function(element){
      element = Math.abs(parseFloat(element));
      if(element < 0.001){
          element = 0.001;
      }
      total += element;
      score_accum_arr.push(total);
  });

    var hue_array = [];
    // var hue_array = ["hsl(0, 0.75, 0.60)"] 
    
    var increment_h = 0.95 / score_data.length;
    var hue_total = 0;
  
    // score_data.forEach(function(){
      
    // })
  
    for(var i = 0; i < score_data.length; i++){
      hue_total += increment_h;
      color_str = hslToRgb(hue_total, 0.75, 0.60);
      hue_array.push(color_str);
    }
  
    // //console.log(score_accum_arr, hue_array);
  
    return {
      "score_data": score_accum_arr,
      "color": hue_array
    };
  }
  
  function createDonutChartTest(score_data, sharedValuesDashboard, idChartTarget) {
    // set the dimensions and margins of the graph
    var width = 900
        height = 300
        margin = 30
    
    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = Math.min(width, height) / 2 - margin
    
    // Remove svg first.
    var d3SelectedId = `d3ImageLoc_${idChartTarget}`
    d3.select(`#${d3SelectedId} svg`).remove();
    
    // append the svg object to the div called 'my_dataviz'
    var svg = d3.select(`#${d3SelectedId}`)
      .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("margin-left", "auto")
        .style("margin-right", "auto")
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Create dummy data
    var data = score_data;
    // set the color scale
    keys = []
    values = []
    Object.keys(score_data).forEach(function(key) {
        // var value = score_data[key];
        values.push(score_data[key]);
        keys.push(key);
    });
    
    //console.log(score_data);
    colors = create_hue_and_arr_data(values).color;
    //console.log(colors)
    
    var color = d3.scaleOrdinal()
      .domain(keys)
      .range(colors);
    
    // Compute the position of each group on the pie:
    var pie = d3.pie()
      .sort(null) // Do not sort group by size
      .value(function(d) {return d.value; })
    var data_ready = pie(d3.entries(data))
    
    // The arc generator
    var arc = d3.arc()
      .innerRadius(radius * 0.5)         // This is the size of the donut hole
      .outerRadius(radius * 0.8)
    
    // Another arc that won't be drawn. Just for labels positioning
    var outerArc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9)
    
    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
      .selectAll('allSlices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', function(d){ return(color(d.data.key)) })
    //   .attr("stroke", "white")
    //   .style("stroke-width", "2px")
    //   .style("opacity", 0.7)
    
    if(sharedValuesDashboard.labelSelected === 'on') {
        // Add the polylines between chart and labels:
        svg
          .selectAll('allPolylines')
          .data(data_ready)
          .enter()
          .append('polyline')
            .attr("stroke", "black")
            .style("fill", "none")
            .attr("stroke-width", 1)
            .attr('points', function(d) {
              var posA = arc.centroid(d) // line insertion in the slice
              var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
              var posC = outerArc.centroid(d); // Label position = almost the same as posB
              var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
              posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
              return [posA, posB, posC]
            })
        
        // Add the polylines between chart and labels:
        svg
          .selectAll('allLabels')
          .data(data_ready)
          .enter()
          .append('text')
            .text( function(d) {return d.data.key; } )
            .attr('transform', function(d) {
                var pos = outerArc.centroid(d);
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                return (midangle < Math.PI ? 'start' : 'end')
            })
    }
    
    if (sharedValuesDashboard.legendSelected === 'on') {
        var ordinal = d3.scaleOrdinal()
      .domain(keys)
      .range(colors);
    
        // var svg = d3.select("svg");
        
        svg
          .selectAll('allPolylines')
          .data(data_ready)
          .enter()
          .append("g")
          .attr("class", "legendOrdinal")
          .attr("transform", "translate(-360,-100)");
        
        var legendOrdinal = d3.legendColor()
    
          .shape("path", d3.symbol().type(d3.symbolCircle).size(30)())
          .shapePadding(1)
          //use cellFilter to hide the "e" cell
        //   .cellFilter(function(d){ return d.label !== "e" })
          .scale(ordinal);
        
        svg.selectAll(".legendOrdinal")
          .call(legendOrdinal);
    }
    
  }
  
function createPieChartTest(score_data, sharedValuesDashboard, idChartTarget) {
    // set the dimensions and margins of the graph
    var width = 900
        height = 300
        margin = 30
    
    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = Math.min(width, height) / 2 - margin
    var d3SelectedId = `d3ImageLoc_${idChartTarget}`

    // Remove svg first.
    d3.select(`#${d3SelectedId} svg`).remove();
    
    // append the svg object to the div called 'my_dataviz'
    var svg = d3.select(`#${d3SelectedId}`)
      .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .style("margin-left", "auto")
        .style("margin-right", "auto")
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    
    // svg.style("display", "block");
    // svg.style("margin-left", "auto");
    // svg.style("margin-right", "auto");
    
    // Create dummy data
    // var data = {a: 9, b: 20, c:30, d:8, e:12, f:3, g:7, h:14}
    console.log(score_data);
    var data = score_data;
    // set the color scale
    keys = []
    values = []
    Object.keys(score_data).forEach(function(key) {
        // var value = score_data[key];
        values.push(score_data[key]);
        keys.push(key);
    });
    //console.log(score_data);
    colors = create_hue_and_arr_data(values).color;
    //console.log(colors)
    var color = d3.scaleOrdinal()
      .domain(keys)
      .range(colors);
    
    // Compute the position of each group on the pie:
    var pie = d3.pie()
      .sort(null) // Do not sort group by size
      .value(function(d) {return d.value; })
    var data_ready = pie(d3.entries(data))
    
    // The arc generator
    var arc = d3.arc()
      .innerRadius(0)         // This is the size of the donut hole
      .outerRadius(radius * 0.8)
    
    // Another arc that won't be drawn. Just for labels positioning
    var outerArc = d3.arc()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9)
    
    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
      .selectAll('allSlices')
      .data(data_ready)
      .enter()
      .append('path')
      .attr("data-legend",function(d) { return d.data.key})
      .attr('d', arc)
      .attr('fill', function(d){ return(color(d.data.key)) })
      
    if(sharedValuesDashboard.labelSelected === 'on') {
        // Add the polylines between chart and labels:
        svg
          .selectAll('allPolylines')
          .data(data_ready)
          .enter()
          .append('polyline')
            .attr("stroke", "black")
            .style("fill", "none")
            .attr("stroke-width", 1)
            .attr('points', function(d) {
              var posA = arc.centroid(d) // line insertion in the slice
              var posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
              var posC = outerArc.centroid(d); // Label position = almost the same as posB
              var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
              posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
              return [posA, posB, posC]
            })
        
        // Add the polylines between chart and labels:
        svg
          .selectAll('allLabels')
          .data(data_ready)
          .enter()
          .append('text')
            .text( function(d) { return d.data.key } )
            .attr('transform', function(d) {
                var pos = outerArc.centroid(d);
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                return 'translate(' + pos + ')';
            })
            .style('text-anchor', function(d) {
                var midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                return (midangle < Math.PI ? 'start' : 'end')
            })
        
    }
    
    if (sharedValuesDashboard.legendSelected === 'on') {
        var ordinal = d3.scaleOrdinal()
      .domain(keys)
      .range(colors);
    
        // var svg = d3.select("svg");
        
        svg
          .selectAll('allPolylines')
          .data(data_ready)
          .enter()
          .append("g")
          .attr("class", "legendOrdinal")
          .attr("transform", "translate(-360,-100)");
        
        var legendOrdinal = d3.legendColor()
    
          .shape("path", d3.symbol().type(d3.symbolCircle).size(30)())
          .shapePadding(1)
          //use cellFilter to hide the "e" cell
        //   .cellFilter(function(d){ return d.label !== "e" })
          .scale(ordinal);
        
        svg.selectAll(".legendOrdinal")
          .call(legendOrdinal);
    }
    
}
  
  // Put bar chart here
  function createBarChart(score_data) {

      
    var d3SelectedId = `d3ImageLoc_${idChartTarget}`
    d3.select(`#${d3SelectedId} svg`).remove()
    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
    
    
    // set the ranges
    var x = d3.scaleBand()
              .range([0, width])
              .padding(0.1);
    var y = d3.scaleLinear()
              .range([height, 0]);

    var svg = d3.select(`#${d3SelectedId}`).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");
    
    var values = []
    var keys = []
    
    Object.keys(score_data).forEach(function(key) {
        values.push(score_data[key]);
        keys.push(key);
    }); 
    
    
    // Scale the range of the data in the domains
    x.domain(keys.map(function(d) { return d }));
    y.domain([0, d3.max(values, function(d) { return d; })]);
    
    // append the rectangles for the bar chart
    svg.selectAll(".bar")
      .data(score_data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.salesperson); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.sales); })
      .attr("height", function(d) { return height - y(d.sales); });
    
    // add the x Axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));
    
    // add the y Axis
    svg.append("g")
      .call(d3.axisLeft(y));
  }
  
  // Create simple pie chart data.
  function createChart(scoreResultKeyValue,
    sharedValuesDashboard,
    idChartTarget
    ){
    
    if(sharedValuesDashboard.chartSelected === 'Pie Chart'){
        createPieChartTest(scoreResultKeyValue,sharedValuesDashboard, idChartTarget);
    } else if (sharedValuesDashboard.chartSelected === 'Donut Chart') {
        createDonutChartTest(scoreResultKeyValue,sharedValuesDashboard, idChartTarget);
    }
  }
  
