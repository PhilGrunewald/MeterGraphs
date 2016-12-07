// ########  Global variables

console.log("hello!")

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
	"activities": []     // activities data
	}

var dim = {}            // dimensions for Canvas and Charts
// it needs to be outside 'data' to avoid recurrency

var graph = {}          // to hold each graph (whole object)

var canvas = d3.select('#canvas').append('svg')

var tooltip = d3.select('body').append('div').attr("class", "tooltip")

var height = {
	"electricity":		 80,
	"activity":			 10,
	"spacing":  		 60,
	"electricity_zoom":	200,
	"activityZoom":		 20
	}

// ########  Read, Prepare the data, call graphs
//marina's version

var apiurl = 'getHHdata.php?hh='+hhid
d3.json(apiurl, function(error, json) {
	if (error){ console.log(error) }

	data.json = json                                        // pointer to received JSON
	data.meta.labels = json.readings[0].labels              // pointer to labels
	data.meta.annotations = json.readings[0].annotations    // pointer to annotations

	var dateParse = d3.time.format("%Y-%m-%d %H:%M:%S").parse  // Date format from JSON

	_.each(json.users, function(user){
		_.each(user.activities, function(act){
			act.idMeta = user.idMeta                        // insert user ID for activityGraph
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
		data.watts.push( watt ) 
		} 
	}

	data.meta.period = {
	  "readings": data.timestamps.length,
	  "min": dateParse(readings.annotations.min.dt),
	  "max": dateParse(readings.annotations.max.dt),
	  "start": d3.min(data.timestamps),
	  "end": d3.max(data.timestamps),
	  "range": ((d3.max(data.timestamps) - d3.min(data.timestamps))/1000) / 60 }

	if((data.meta.period.readings - (data.meta.period.range)) != 0){
		console.log("Range of time and Bins of data do NOT match") 
		}

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
	electricityGraph('electricity')
	electricityGraph('electricity_zoom')
	activityGraph('activities_zoom')
	activityGraph('activities_all')
	brush('electricity')
	
	// trigger the zoom window to draw to brush size
	graph.electricity_zoom.call(graph.electricity.electricity.event)

	}) // d3.json

function setDimensions(){
	// assign widths and heights
	var margin = {
		"left": 40,
		"right": 10 
		}

	var canvasheight = height.electricity_zoom + height.spacing + height.electricity

	dim = {
		"canvas": {
			"width": 650,
			"height": canvasheight },
		"activities_all": {
			top: 0,
			bottom: height.electricity/2,
			right: margin.right,
			left: margin.left},
		"electricity": {
			top: 0,
			bottom: canvasheight - (height.electricity),
			right: margin.right,
			left: margin.left},
		"activities_zoom": {
			top: height.electricity + height.spacing,
			bottom: 0,
			right: margin.right,
			left: margin.left},
		"electricity_zoom": {
			top: height.electricity + height.spacing,
			bottom: 0,
			right: margin.right,
			left: margin.left}
		} // dim
	return dim
	} // dimensions

function activityGraph(name){
	// Draws glyphs for activities
	// Remove previous
	d3.select('#activityGraph_'+name).remove();
	delete graph[name]

	// #######  Dimensions
	graph[name] = canvas.append('g')
	.attr('id', 'activityGraph_'+name)
	.attr('transform', 'translate('+ dim[name].left +', '+ dim[name].top +')')
	graph[name].dim = { // add values to each graph-object for self-reference
		"width": dim.canvas.width - dim[name].left - dim[name].right,
		"height": dim.canvas.height - dim[name].top - dim[name].bottom }

	// // #######  Scales

	graph[name].scale = {
		// "colours": d3.scale.linear().range(['#00f','#C61C6F', '#268BD2', '#85992C']),
		"x": d3.time.scale().range([0, graph[name].dim.width]),
		"y": d3.scale.linear().range([graph[name].dim.height, 0]) }

	graph[name].axis = {
		"x": d3.svg.axis().scale(graph[name].scale.x).orient("top").tickSize(0),
		"y": d3.svg.axis().scale(graph[name].scale.y).orient('left') }

	// ########  Domains

	var xValue = d3.extent(data.energy, function(d) { return d.timestamp })
	graph[name].scale.x.domain( d3.extent( xValue ) )

	// Width and height
	var xDtValue = function(d) { return data.timestamps.indexOf(d.dt_period)} // data -> value
	var xMap = function(d) { return graph[name].scale.x( d.dt_period ) } // data -> display
	// if on zoom scatter: space by 20px per user, in overview: 15px 
	var yMap = function(d){return (data.meta.users.indexOf(d.idMeta) * ((name=='activities_zoom')?height.activityZoom:height.activity) ) }
	// if in overview make blobs bigger (17 rather than 10 min)
	var wMap = graph[name].dim.width / ( (data.energy.length - 1) / ((name=='activities_zoom')?10:17))
	// if on zoom scatter: 20px high, in overview: 15px high
	var hMap = function(d){return ((name=='activities_zoom')?height.activityZoom:height.activity)}
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
				periods[bin].activities.push(act) 
				} 
			}) 
	})
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
		.style("visibility", "visible") 
		.style("opacity", .9);
		tooltip.html(toolbox_label(d))
		.style("left", (d3.event.pageX + 5) + "px")
		.style("top", (d3.event.pageY - 28) + "px") 
		})
	.on("mouseout", function(d) {
		tooltip.transition()
		.duration(1500)
		.style("opacity", 0)  
		.style("border", "none")
		})
	//.on('click', function(d){
	//    $('#timestamp').val(d.dt_period)
	//    $('#modalActivity').modal('show') })

	// User labels
	if(name == 'activities_zoom'){
		var yLine = 0						// height of User ID label
		_.each(data.users, function(user){
			graph[name].append('text')
			.attr('x', 0)
			.attr('y', yLine)
			.attr('dy', '1em')
			.attr('text-anchor', 'start')
			.text(user.label)
			.attr('fill', user.dotcolour)
			.attr('class', 'userLabel')
			yLine += height.activityZoom
			}) 
		}
	} // activity graph

function electricityGraph(name){
	// Draws a filled area 
	// Remove previous
	d3.select('#electricityGraph_'+name).remove()
	delete graph[name]

	// #######  Dimensions

	graph[name] = canvas.append('g')
	.attr('id', 'electricityGraph_'+name)
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

	area = d3.svg.area()
		.x(function(d) { return graph[name].scale.x(d.timestamp) })
		.y0(function(d) { return graph[name].scale.y(d.watt) })
		.y1(graph[name].dim.height);
	graph[name].append('path')
		.datum(data.energy)
		.attr('class', 'area-energy')
		.attr('d', area);

	if(name == 'electricity_zoom'){
		graph[name].append('g')
		.attr('class', 'x axis')
		.attr('id', 'x_axis_el_zoom')
		.attr('transform', 'translate(0, ' + graph[name].dim.height/2 + ')')
		//either: ============= SHORTER, BUT NO SUPERSCRIPT IN SVG ============= 
		// .call(graph[name].axis.x
		// 	.ticks(1)
		// 	.tickFormat(function(d){
		// 		var format = d3.time.format('%-I %p');
		// 		var out = (format(d)).split(" ", 2);// (format(d)).split(" ", 2);
		// 		var date = out[0] + " " + (out[1].toLowerCase());
		// 		return date;})
		// 	)
		// .selectAll("text")
		// .attr('class', 'timelabelZoom')
		//or: ============= A BLUNT HACK ============= 
		.call(graph[name].axis.x
						.ticks(2)
						.tickFormat(""))
		var v = graph[name].selectAll('g')
		var text_hour = v.selectAll("g")
 			.append("text")
		 	.style("font-size", "80")
		  	.style("fill","#666")
		  	.style("text-anchor", "end")
		 	.attr("x", -70)
		 	.text(function(d){
						var format = d3.time.format('%-I %p');
						var out = (format(d)).split(" ", 2);
						var date = out[0];
						return date;})
		var text_ampm = v.selectAll("g")
		    .append("text")
		 	.style("text-anchor", "end")
		 	.style("font-size", "40")
		 	.attr("fill","#666")
		 	.attr("y", -33)
		 	.text(function(d){
						var format = d3.time.format('%-I %p');
						var out = (format(d)).split(" ", 2);
						var date = out[1].toLowerCase();
						return date;})
		text_hour.attr("transform", "translate(0,-80), rotate(-90)")
		text_ampm.attr("transform", "translate(0,-80), rotate(-90)")
		//=============================================
		} else {
		// full range with more ticks and standard date format
		graph[name].append('g')
		.attr('class', 'x axis')
		.attr('transform', 'translate(0, ' + graph[name].dim.height/2 + ')')
		.call(graph[name].axis.x
			.ticks(4)
			)
		.selectAll("text")
		.attr('class', 'timelabel')
		}

	graph[name].append('g')
	.attr('class', 'y axis')
	.call(graph[name].axis.y.ticks(0))
	.append('text')
	.attr('dy', '-0.5em')
	.attr('dx', '-200')  // to match height.electricity_zoom
	.attr('text-anchor', 'start')
	.attr('class', 'energy-y-label')
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

	// ######## Handle the area to bisect data

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
		focus.style('display', null) 
		})
	.on('mouseout', function(d) {
		focus.style('display', 'none') 
		})
	.on('mousemove', function() {
	// 	var mouse = d3.mouse(this);
	// 	var mouseDate = graph[name].scale.x.invert(mouse[0]);
	// 	var i = bisectDate(data.energy, mouseDate); // returns the index to the current data item
	// 	var d = data.energy[i];
	// 	console.log(i) // value from x.y
	// 	var x = graph[name].scale.x(d.timestamp);
	// 	var y = graph[name].scale.y(d.watt);

	// 	focus.select('#focusCircle')
	// 	.attr('cx', x)
	// 	.attr('cy', y);
	// 	focus.select('#focusLineX')
	// 	.attr('x1', x).attr('y1', graph[name].scale.y(yValue[0]))
	// 	.attr('x2', x).attr('y2', graph[name].scale.y(yValue[1]));
	// 	focus.select('#focusLineY')
	// 	.attr('x1', graph[name].scale.x(xValue[0])).attr('y1', y)
	// 	.attr('x2', graph[name].scale.x(xValue[1])).attr('y2', y) 
		})
	// .on('click', function(){
	//     var mouse = d3.mouse(this);
	//     var mouseDate = graph[name].scale.x.invert(mouse[0])
	//     var i = bisectDate(data.energy, mouseDate) // returns the index to the current data item
	//     var d1 = data.energy[i]
	//     // d1.timestamp) })
	//     $('#timestamp').val(d1.timestamp)
	//     $('#modalActivity').modal('show') })
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
			.text(avgLine.label + " (" + avgLine.lineValue + " Watt)")
			.attr('class', 'zerolinetext');
		}
	}
	} // end electricityGraph


function brush(name){
	//Draw the zooming brush
	graph[name].electricity = d3.svg.brush()
	.x(graph[name].scale.x)
	.on("brushstart", brushstart)  // on mousedown
	.on("brush", brushmove)        // on mousemove, if the brush extent has changed
	.on("brushend", brushend)      // on mouseup

	graph[name].electricity.extent( recenter(data.meta.period.max) )
	drawBrush()
	drawBrushOpaque()

	function recenter(timestamp) {
		console.log("Phil: " + timestamp);
		// return 'from to' positions for brush to fit around the timestamp
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
		} // end recenter


	function drawBrushOpaque() {
		graph.activities_all.selectAll(".brush_opaque").remove();
		//graph[name].selectAll('.zerolinetext').remove(); - to do: REMOVE ANNOTATION TEXTS AND DRAW THEM OVER THE OPACITY
		graph.activities_all.selectAll(".rect")
								  .data([
								  	graph[name].electricity.extent()[0],
								  	graph[name].electricity.extent()[1],
								  	])
								  .enter()
								  .append("rect")
								  .attr("class", "brush_opaque")
								  .attr("x", function(d, i) {
								   return (i == 0) ? graph.electricity.scale.x.range()[0] : graph.electricity.scale.x(d)
									})
								  .attr("y", 0)
                                  .attr("width", function(d, i) {
                                  	return (i == 0) ? (graph.electricity.scale.x(d) - graph.electricity.scale.x.range()[0]) : 
                                  	(graph.electricity.scale.x.range()[1] - graph.electricity.scale.x(d))
                                  })
                                  .attr("height",graph[name].dim.height)
	}
	
	function drawBrush(){
		drawBrushOpaque();
		// remove old and display new
		d3.selectAll("g.electricity").remove() // Remove previous brush
		brushg = graph[name].append("g")
		.attr("class", "brush")
		.call(graph[name].electricity);

		brushg.selectAll(".resize").append("path")
		.attr("transform", "translate(0," +  graph[name].dim.height / 2 + ")")

		brushg.selectAll("rect")
		.attr("height", graph[name].dim.height);
		} // drawBrush

	function brushstart() {
		// get current position of brush
		graph[name].electricity.position = graph[name].electricity.extent()
		}

	function brushmove() {
		drawBrushOpaque();
		// update the brush extent
		if( graph[name].electricity.position[0] > graph[name].electricity.extent()[1] || graph[name].electricity.position[1] < graph[name].electricity.extent()[0] ) {
			graph[name].electricity.extent( recenter(graph[name].electricity.extent()[0]) ) 
			}

		var extent = graph[name].electricity.extent()
		var readings = data.meta.period.readings
		var range = graph[name].dim.width
		var from = parseInt( (graph[name].scale.x(extent[0]) * readings)/range )
		var to = parseInt( (graph[name].scale.x(extent[1]) * readings)/range )

		data.energy = []
		for (i=from, j=to; i<j; i++) {
			data.energy.push({
					"timestamp": data.timestamps[i], 
					"watt": data.watts[i] }) }

		electricityGraph("electricity_zoom")
		activityGraph("activities_zoom")

		d3.selectAll("g.electricity").call(graph[name].electricity)
		} // brushmove

	function brushend() {
		// d3.selectAll("g.electricity").call(graph[name].electricity)
	}



	} // end brush


function toolbox_label(d){
	// populate the activity box
	var html = formatDayTime(d.dt_period)
	_.each(d.activities,function(act){
		var enjoy = "<img src=img/enjoy_"+((act.enjoyment!='undefined')?act.enjoyment:"0")+".png width='20px' height='20px'>"
		var location = "<img src=img/location_"+((act.location!='undefined')?act.location:"0")+".png width='20px' height='20px'>"
		html += '<br>'+act.activity+' '+location+' '+enjoy  
		})
	return html
	} // toolbox label

function formatDayTime(date){
	// Return day and time in format "Thu, 9:20"
	var seconds = date.getSeconds()
	var minutes = date.getMinutes()
	var hour = date.getHours()

	var year = date.getFullYear()
	var months = ['JAN','FEB','NAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
	var month = date.getMonth() // beware: January = 0; February = 1, etc.
	var day = date.getDate()

	var daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
	var dayOfWeek = date.getDay() // Sunday = 0, Monday = 1, etc.
	var milliSeconds = date.getMilliseconds()

	var pad = '00'

	return daysOfWeek[dayOfWeek] + ', ' + hour + ':' + (pad + minutes).slice(-pad.length) 
	} // end formatDayTime

// form edit
	// unused
	// $('body').on('click', '#submitActivity', function(){
	//     // $('#formEditActivity').submit()
	//     $('#modalActivity').modal('toggle')
	// 
	// })
