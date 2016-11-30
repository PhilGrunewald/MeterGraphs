// ########  Global variables

var data = {
  "json": {},           // pointer to received JSON
  "meta": {             // pointer to metadata
    "labels": {},       // labels for graph
    "annotations": {},  // graph annotations (avg, peak, base)
    "period": {},       // 'start' and 'end' (date-time), 'range' and 'readings'
    "users": [] },      // users list
  "users": {},          // users data
  "timestamps": [],     // readings timestamps
  "watts": [],          // readings power
  "energy": [],         // readings energy (timestamp-watt object)
  "activities": [] }    // activities data

var dim = {}            // dimensions for Canvas and Charts
                        // it needs to be outside 'data' to avoid recurrency

var graph = {}          // to hold each graph (whole object)

var canvas = d3.select('#canvas').append('svg')

var tooltip = d3.select('body').append('div').attr("class", "tooltip")


// ########  Read, Prepare the data, call graphs

var apiurl = 'http://www.distributed-energy.de/graphdev/getHHdata.php?hh='+hhid
d3.json(apiurl, function(error, json) {
  if (error){ console.log(error) }

  data.json = json                                        // pointer to received JSON
  data.meta.labels = json.readings[0].labels              // pointer to labels
  data.meta.annotations = json.readings[0].annotations    // pointer to annotations

  var dateParse = d3.time.format("%Y-%m-%d %H:%M:%S").parse  // Date format from JSON

  _.each(json.users, function(user){
    _.each(user.activities, function(act){
      act.idMeta = user.idMeta                        // insert user ID for scatterGraph
      act.dt_period = dateParse(act.period)           // parseDate
      act.dt_activity = dateParse(act.dt_activity) }) // parseDate
    data.users[user.idMeta] = user
    data.meta.users.push(user.idMeta) })

  var readings = json.readings[0]
  for (i = 0; i < readings.dt.length ; i++) {
    if( readings.dt[i] && readings.Watt[i] ){
      var timestamp = dateParse(readings.dt[i])
      var watt = parseInt(readings.Watt[i])
      data.energy.push({
        "timestamp": timestamp, 
        "watt": watt })
      data.timestamps.push( timestamp )
      data.watts.push( watt ) } }

  data.meta.period = {
    "readings": data.timestamps.length,
    "min": dateParse(readings.annotations.min.dt),
    "max": dateParse(readings.annotations.max.dt),
    "start": d3.min(data.timestamps),
    "end": d3.max(data.timestamps),
    "range": ((d3.max(data.timestamps) - d3.min(data.timestamps))/1000) / 60 }

  if((data.meta.period.readings - (data.meta.period.range)) != 0){
    console.log("Range of time and Bins of data do NOT match") }

  // ---- Data is ready, let's start by calculating the graphs' dimensions
  setDimensions()

  canvas
    .attr('width', dim.canvas.width)
    .attr('height', dim.canvas.height)

  canvas.append("text")
      .attr("id", "label")
      .style("font-size", "36px")
      .style("fill", "#9a9a9a")
      .attr("transform", "translate(" + 100 + "," + 80 + ")");

  // And create the graphs --- simple!!!
  areaGraph('brush')
  brush('brush')
  lineGraph("energy")
  scatterGraph('activities')
  scatterGraph('brushactivities')

  graph.energy.call(graph.brush.brush)
  graph.energy.call(graph.brush.brush.event)

})


// ****************************************
//    Graphs
// ****************************************

function areaGraph(name){

// #######  Dimensions

  graph[name] = canvas.append('g')
    .attr('id', 'areaGraph_'+name)
    .attr('transform', 'translate('+ dim[name].left +', '+ dim[name].top +')')
  graph[name].dim = { // self-reference graph real dimensions
    "width": dim.canvas.width - dim[name].left - dim[name].right,
    "height": dim.canvas.height - dim[name].top - dim[name].bottom }

// #######  Scales

  graph[name].scale = {
      "colours": d3.scale.linear().range(['#B58929','#C61C6F', '#268BD2', '#85992C']),
      "x": d3.time.scale().range([0, graph[name].dim.width]),
      "y": d3.scale.linear().range([graph[name].dim.height, 0]) }

  graph[name].axis = {
      "x": d3.svg.axis().scale(graph[name].scale.x).orient("bottom"),
      "y": d3.svg.axis().scale(graph[name].scale.y).ticks(10).orient('left') }

// ########  Domains

  graph[name].scale.x.domain( d3.extent( data.timestamps ) )
  graph[name].scale.y.domain( [0, d3.max( data.watts )] )

// ######## Graphs

  graph[name].append("path").datum(data.energy)
      .attr("class", "area")
      .attr("d", d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return graph[name].scale.x(d.timestamp) })
        .y0(graph[name].dim.height)
        .y1(function(d) { return graph[name].scale.y(d.watt) }) )

// ######## Axes

  // Add the X axes
  graph[name].append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + graph[name].dim.height + ")")
      .call(graph[name].axis.x);
}

function scatterGraph(name){

    // Remove previous
    d3.select('#scatterGraph_'+name).remove();
    delete graph[name]

// #######  Dimensions

  graph[name] = canvas.append('g')
    .attr('id', 'scatterGraph_'+name)
    .attr('transform', 'translate('+ dim[name].left +', '+ dim[name].top +')')
  graph[name].dim = { // add values to each graph-object for self-reference
    "width": dim.canvas.width - dim[name].left - dim[name].right,
    "height": dim.canvas.height - dim[name].top - dim[name].bottom }

// // #######  Scales

  graph[name].scale = {
      "colours": d3.scale.linear().range(['#B58929','#C61C6F', '#268BD2', '#85992C']),
      "x": d3.time.scale().range([0, graph[name].dim.width]),
      "y": d3.scale.linear().range([graph[name].dim.height, 0]) }

  graph[name].axis = {
      "x": d3.svg.axis().scale(graph[name].scale.x).orient("top").tickSize(0),
      "y": d3.svg.axis().scale(graph[name].scale.y).ticks(10).orient('left') }

// ########  Domains

  var xValue = d3.extent(data.energy, function(d) { return d.timestamp })
  graph[name].scale.x.domain( d3.extent( xValue ) )

  var xDtValue = function(d) { return data.timestamps.indexOf(d.dt_period)} // data -> value
  var xMap = function(d) { return graph[name].scale.x( d.dt_period ) } // data -> display
  var yMap = function(d){return (data.meta.users.indexOf(d.idMeta) * ((name=='activities')?30:8) ) + 40 }
  var wMap = graph[name].dim.width / ( (data.energy.length - 1) / 10 )
  var hMap = (graph[name].dim.height - 40) / (data.meta.users.length + 1)
  // var cValue = function(d) { return d.dotcolour}

// ######## Prepare data according to range

  data.activities = []
  var periods = {}
  _.each(data.users, function(user){
    _.each(user.activities,function(act){
      if((act.dt_activity > xValue[0]) && (act.dt_activity < xValue[1])){
        var bin = act.period+'_'+act.idMeta
        if(!periods.hasOwnProperty(bin)) periods[bin] = {
          "dt_period": act.dt_period, 
          "idMeta": act.idMeta,
          "dotcolour": act.dotcolour,
          "activities": []}
        data.activities.push(act)
        periods[bin].activities.push(act) } }) })

  data.periods = []
  _.each(periods,function(period){ data.periods.push(period) })  

// ######## Graphs

  graph[name].selectAll('rect').data(data.periods)
    .enter().append('rect')
        .style('fill', function(d,i) { return d.dotcolour })
        .attr('width', wMap )
        .attr('x', xMap)
        .attr('height', hMap)
        .attr('y', yMap )
        .attr("rx", 6)
        .attr("ry", 6)
      .on("mouseover", function(d) {
          tooltip.transition()
               .duration(200)
               .style("opacity", .9);
          tooltip.html(toolbox_label(d))
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px") })
      .on("mouseout", function(d) {
          tooltip.transition()
               .duration(500)
               .style("opacity", 0) })
      .on('click', function(d){
          $('#timestamp').val(d.dt_period)
          $('#modalActivity').modal('show') })

// ######## Axes

  // Add the X axes
  graph[name].append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,20)")
      .call(graph[name].axis.x);

  // Add the Y axes

  if(name != 'brushactivities'){
    var yLine = 10
    _.each(data.users, function(user){
      yLine += 30
      graph[name].append('text')
          .attr('x', 0)
          .attr('y', yLine)
          .attr('dy', '1em')
          .attr('text-anchor', 'end')
          .text(user.idMeta)
              .attr('fill', user.dotcolour)
              .attr('class', 'userLabel')
  }) }
}

var lineGraph = function(name) {

    // Remove previous
    d3.select('#lineGraph_'+name).remove()
    delete graph[name]

// #######  Dimensions

    graph[name] = canvas.append('g')
      .attr('id', 'lineGraph_'+name)
      .attr('transform', 'translate('+ dim[name].left +', '+ dim[name].top +')')
    graph[name].dim = { // add values to each graph-object for self-reference
      "width": dim.canvas.width - dim[name].left - dim[name].right,
      "height": dim.canvas.height - dim[name].top - dim[name].bottom }

// #######  Scales && Domains

    var xValue = d3.extent(data.energy, function(d) { return d.timestamp })
    var yValue = d3.extent(data.energy, function(d) { return d.watt })

    graph[name].scale = {
      "x": d3.time.scale().range([0, graph[name].dim.width]).domain(xValue),
      "y": d3.scale.linear().range([graph[name].dim.height, 0]).domain(d3.extent(data.watts)) }

    graph[name].axis = {
      "x": d3.svg.axis().scale(graph[name].scale.x).orient('bottom'),
      "y": d3.svg.axis().scale(graph[name].scale.y).orient('left') }

// ######## Graphs

    var line = d3.svg.line()
        .x(function(d) { return graph[name].scale.x(d.timestamp); })
        .y(function(d) { return graph[name].scale.y(d.watt); });

    var area = d3.svg.area()
        .x(function(d) { return graph[name].scale.x(d.timestamp) })
        .y0(function(d) { return graph[name].scale.y(d.watt) })
        .y1(graph[name].dim.height);

    graph[name].append('path')
        .datum(data.energy)
        .attr('class', 'area')
        .attr('d', area);

    graph[name].append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, ' + graph[name].dim.height + ')')
        .call(graph[name].axis.x);

    graph[name].append('g')
        .attr('class', 'y axis')
        .call(graph[name].axis.y)
        .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .attr('text-anchor', 'end')
            .text(data.meta.labels.y_axis);

    graph[name].append('path')
        .datum(data.energy)
        .attr('class', 'line')
        .attr('d', line);

    graph[name].selectAll('circle').data(data).enter().append('circle')
        .attr('cx', function(d) { return graph[name].scale.x(d.timestamp) })
        .attr('cy', function(d) { return graph[name].scale.y(d.watt) })
        .attr('r', 1)
        .attr('class', 'circle');

    var focus = graph[name].append('g').style('display', 'none');
        
    focus.append('line')
        .attr('id', 'focusLineX')
        .attr('class', 'focusLine');
    focus.append('line')
        .attr('id', 'focusLineY')
        .attr('class', 'focusLine');
    focus.append('circle')
        .attr('id', 'focusCircle')
        .attr('r', 4)
        .attr('class', 'circle focusCircle');

// ######## Hnadle the area to bisect data

    var bisectDate = d3.bisector(function(d) { return d.timestamp }).left;

    graph[name].append('rect')
        .attr('class', 'overlay')
        .attr('width', graph[name].dim.width)
        .attr('height', graph[name].dim.height)
        .on('mouseover', function(d) {
            tooltip.transition()
              .style('opacity', .9)
            tooltip.html(d)
              .style('left', (d3.event.pageX - 35) + 'px')
              .style('top',  (d3.event.pageY - 30) + 'px')
            focus.style('display', null) })
        .on('mouseout', function(d) {
            focus.style('display', 'none') })
        .on('mousemove', function() {
            var mouse = d3.mouse(this);
            var mouseDate = graph[name].scale.x.invert(mouse[0]);
            var i = bisectDate(data.energy, mouseDate); // returns the index to the current data item

            var d0 = data.energy[i - 1]
            var d1 = data.energy[i];
            // work out which date value is closest to the mouse
            var d = mouseDate - d0.timestamp > d1.timestamp - mouseDate ? d1 : d0;
            // console.log(d.timestamp) // value from x.y
            var x = graph[name].scale.x(d.timestamp);
            var y = graph[name].scale.y(d.watt);

            focus.select('#focusCircle')
                .attr('cx', x)
                .attr('cy', y);
            focus.select('#focusLineX')
                .attr('x1', x).attr('y1', graph[name].scale.y(yValue[0]))
                .attr('x2', x).attr('y2', graph[name].scale.y(yValue[1]));
            focus.select('#focusLineY')
                .attr('x1', graph[name].scale.x(xValue[0])).attr('y1', y)
                .attr('x2', graph[name].scale.x(xValue[1])).attr('y2', y) })
        .on('click', function(){
            var mouse = d3.mouse(this);
            var mouseDate = graph[name].scale.x.invert(mouse[0])
            var i = bisectDate(data.energy, mouseDate) // returns the index to the current data item
            var d1 = data.energy[i]
            // d1.timestamp) })
            $('#timestamp').val(d1.timestamp)
            $('#modalActivity').modal('show') })

// ######## Average lines

    avgLine({ lineValue: data.meta.annotations.avg.Watt, label: data.meta.annotations.avg.label })
    avgLine({ lineValue: data.meta.annotations.max.Watt, label: data.meta.annotations.max.label })
    avgLine({ lineValue: data.meta.annotations.min.Watt, label: data.meta.annotations.min.label })

    var xValue = d3.extent(data.energy, function(d) { return d.timestamp })
    function avgLine(avgLine){
        if(xValue[0]){ // Check if xValue[0] is NaN
          graph[name].append('line')
              .attr('x1', graph[name].scale.x(xValue[0]))
              .attr('y1', graph[name].scale.y(avgLine.lineValue))
              .attr('x2', graph[name].scale.x(xValue[1]))
              .attr('y2', graph[name].scale.y(avgLine.lineValue))
              .attr('class', 'zeroline');
          graph[name].append('text')
              .attr('x', graph[name].scale.x(xValue[1]))
              .attr('y', graph[name].scale.y(avgLine.lineValue))
              .attr('dy', '1em')
              .attr('text-anchor', 'end')
              .text(avgLine.label)
            .attr('class', 'zerolinetext');
        }
    }
}

// ****************************************
// Brush functions
// ****************************************

function brush(name){

    // Draw the brush
    graph[name].brush = d3.svg.brush()
        .x(graph[name].scale.x)
        .on("brushstart", brushstart)  // on mousedown
        .on("brush", brushmove)        // on mousemove, if the brush extent has changed
        .on("brushend", brushend)      // on mouseup

    graph[name].brush.extent( recenter(data.meta.period.max) )
    drawBrush()

  function recenter(timestamp){

    var hhf = 180*60*1000 // three hours (180min)
    var from = timestamp.getTime() - hhf 
    var to = timestamp.getTime() + hhf

    var end = data.meta.period.end.getTime()
    var start = data.meta.period.start.getTime()

    if(to > end){
      var from = end - ( 2 * hhf )
      var to = end }

    if(from < start){
      var from = start
      var to = start + ( 2 * hhf ) }

    from = new Date(from)
    to = new Date(to)

    return [from,to]
  }

  function drawBrush(){
    d3.selectAll("g.brush").remove() // Remove previous brush
    brushg = graph[name].append("g")
      .attr("class", "brush")
      .call(graph[name].brush);

    brushg.selectAll(".resize").append("path")
      .attr("transform", "translate(0," +  graph[name].dim.height / 2 + ")")

    brushg.selectAll("rect")
      .attr("height", graph[name].dim.height);
  }

  function brushstart() {
    graph[name].brush.position = graph[name].brush.extent()
  }

  function brushmove() {
    if( graph[name].brush.position[0] > graph[name].brush.extent()[1] || graph[name].brush.position[1] < graph[name].brush.extent()[0] ){
      graph[name].brush.extent( recenter(graph[name].brush.extent()[0]) ) }

    var extent = graph[name].brush.extent()
    var readings = data.meta.period.readings
    var range = graph[name].dim.width
    var from = parseInt( (graph[name].scale.x(extent[0]) * readings)/range )
    var to = parseInt( (graph[name].scale.x(extent[1]) * readings)/range )

    data.energy = []
    for (i=from, j=to; i<j; i++) {
      data.energy.push({
          "timestamp": data.timestamps[i], 
          "watt": data.watts[i] }) }

    lineGraph("energy")
    scatterGraph("activities")

    d3.selectAll("g.brush").call(graph[name].brush)
  }

  function brushend() {
    // d3.selectAll("g.brush").call(graph[name].brush)
  }
}

// ****************************************
// Calculate the dimaensions of graphs
// ****************************************

function setDimensions(){

  var height = {
    "activities": data.meta.users.length*30,
    "energy": 400,
    "brushactivities": data.meta.users.length*8,
    "brush": 100 }
  var margin = {
    "left": 40,
    "right": 10 }

  var canvasheight = height.activities + height.energy + height.brushactivities + height.brush + 80

  dim = {
    "canvas": {
      "width": 960,
      "height": canvasheight },
    "activities": {
      top: 10,
      bottom: canvasheight - (height.activities + 20 ),
      right: margin.right,
      left: margin.left},
    "energy": {
      top: height.activities + 50,
      bottom: canvasheight - (height.activities + 20 + height.energy),
      right: margin.right,
      left: margin.left},
    "brushactivities": {
      top: height.activities + height.energy + 50,
      bottom: canvasheight - (height.activities + 20 + height.energy + height.brush),
      right: margin.right,
      left: margin.left},
    "brush": {
      top: height.activities + height.energy + 50 + height.brushactivities,
      bottom: canvasheight - (height.activities + 20 + height.energy + height.brushactivities + height.brush),
      right: margin.right,
      left: margin.left}
    }

  return dim
}


// ****************************************
//    To handle the Form submisiion
// ****************************************

$('body').on('click', '#submitActivity', function(){
    // $('#formEditActivity').submit()
    $('#modalActivity').modal('toggle')

})


// ****************************************
//    Helpers
// ****************************************

function toolbox_label(d){
  var html = retHour(d.dt_period)
  _.each(d.activities,function(act){

    var enjoy = "<img src=img/enjoy_"+((act.enjoyment!='undefined')?act.enjoyment:"0")+".png width='20px' height='20px'>"
    var location = "<img src=img/location_"+((act.location!='undefined')?act.location:"0")+".png width='20px' height='20px'>"
    html += '<br>'+act.activity+' - '+location+" - "+enjoy  })
  return html
}

function retHour(date){
  var seconds = date.getSeconds()
  var minutes = date.getMinutes()
  var hour = date.getHours()

  var year = date.getFullYear()
  var months = ['JAN','FEB','NAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  var month = date.getMonth() // beware: January = 0; February = 1, etc.
  var day = date.getDate()

  var daysOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  var dayOfWeek = date.getDay() // Sunday = 0, Monday = 1, etc.
  var milliSeconds = date.getMilliseconds()

  var pad = '00'

  return daysOfWeek[dayOfWeek] + ', ' + (pad + hour).slice(-pad.length) + ':' + (pad + minutes).slice(-pad.length) 
}

Date.prototype.addHours = function(h) {    
   this.setTime(this.getTime() + (h*60*60*1000)); 
   return this;   
}