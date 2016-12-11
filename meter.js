//========================== GLOBALS ==============================
var data = {
	"json": {},             // pointer to received JSON
	"meta": {               // pointer to metadata
		"labels": {},       // labels for graph
		"annotations": {},  // graph annotations (avg, peak, base)
		"period": {},       // 'start' and 'end' (date-time), 'range' and 'readings'
		"users": [] },      // users list
	"users": {},            // users data
	"timestamps": [],       // readings timestamps
	"watts": [],            // readings power
	"energy": [],           // readings energy (timestamp-watt object)
	"activities": [],       // activities data
	//function reading in the data in is now here, since it's operative only on this specific structure
	read_in: function(incoming_json) {
		this.json = incoming_json                                        // pointer to received JSON
		this.meta.labels = incoming_json.readings[0].labels              // pointer to labels
		this.meta.annotations = incoming_json.readings[0].annotations    // pointer to annotations

		var pointer_to_users = this.users; //necessary since the meaning of 'this' will change within the proximal loops
		var pointer_to_meta = this.meta;
		var dateParse = d3.time.format("%Y-%m-%d %H:%M:%S").parse  // Date format from JSON
		_.each(incoming_json.users, function(user){
			_.each(user.activities, function(act){
				act.idMeta = user.idMeta                        // insert user ID for activityGraph
				act.dt_period = dateParse(act.period)           // parseDate
				act.dt_activity = dateParse(act.dt_activity) }) // parseDate
		pointer_to_users[user.idMeta] = user
		pointer_to_meta.users.push(user.idMeta)
		})

		var readings = incoming_json.readings[0]
		for (i = 0; i < readings.dt.length ; i++) {
			if( readings.dt[i] && readings.Watt[i] ){
				var timestamp = dateParse(readings.dt[i])
				var watt = parseInt(readings.Watt[i])
				this.energy.push({
				  	  "timestamp": timestamp,
				  	  "watt": watt })
				this.timestamps.push( timestamp )
				this.watts.push( watt )
				}
		}

		this.meta.period = {
		  "readings": this.timestamps.length,
		  "min": dateParse(readings.annotations.min.dt),
		  "max": dateParse(readings.annotations.max.dt),
		  "start": d3.min(this.timestamps),
		  "end": d3.max(this.timestamps),
		  "range": ((d3.max(this.timestamps) - d3.min(this.timestamps))/1000) / 60
		}

		if((this.meta.period.readings - (this.meta.period.range)) != 0){
			console.log("Range of time and Bins of data do NOT match")
		}
	}
}

var height = {
	"overview": 		80,
	"activities":       10,
	"spacing":          60,
	"zoom":            200,
	"activities_zoom":  20
}
var margins = {
	"canvas_left":      40,
	"canvas_top":				10,
	"canvas_right":     10
}
//=================================================================


var tooltip = d3.select('body').append('div').attr("class", "tooltip");
var canvas = d3.select('#canvas') //a Pointer to newly created svg element
							 .append('svg')
							 .attr('transform', 'translate(' + margins.canvas_left + ', ' + + margins.canvas_top + ')');
var overview = canvas.append('g')
										 .attr('transform', 'translate(10, 10)');
var electricity_area = overview.append('g')
															 .attr('transform', 'translate(10, 10)');



// ########  Read, Prepare the data, call graphs
var apiurl = 'getHHdata.php?hh='+hhid
d3.json(apiurl, function(error, json) {
	if (error){ console.log(error) } //are we sure if don't want this to be an IF/ELSE?
	data.read_in(json);

	canvas.append("g")
				.attr("class", "overview")


	// Two alternative ways of doing the same
	// circ = d3.select('svg').append("circle")
	// rect = canvas.append("rect")















})
