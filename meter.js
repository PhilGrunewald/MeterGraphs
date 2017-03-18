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
                    var initial_timestamp = this.timestamps[0];
                var one_minute_interval = 60000;
                gaps = [];
                for (var i = 1; i < this.timestamps.length; i++) {
                    if ((this.timestamps[i] - this.timestamps[i-1]) != one_minute_interval) {
                        gaps.push({'start':this.timestamps[i-1],
                            'end':this.timestamps[i]});
                    }
                }
            }
        }
}

var height = {
    // top graph
    "overview":                   80,
    "activity":                    8,        // icon size
    "activities_bar":             10,
    "activities_bar_spacing":      2,        // vertical distance between activities bars

    // between grpahs
    "spacing":                    30,        // between graphs

    // bottom graph
    "zoom":                      250,
    "activity_zoom":              18,        // icon size
    "activities_bar_zoom":        20,
    "activities_bar_spacing_zoom": 4,    //vertical distance between activities bars

    "el_reading_boxes":            100        //otherwise text does not fit
}

var width = {
    "electricity":      600,
    "el_reading_boxes": 160        //otherwise text does not fit
}

var margins = {
    "canvas_left":   20,
    "canvas_top":    10,
    "canvas_right":  10,
    "zoom_left":     40,
    "overview_top":  20,
    "overview_left": 40
}

var annotation_peak_radius = 5;

//=================================================================


// ########  Read, Prepare the data, call graphs
var apiurl = 'getHHdata.php?hh='+hhid
d3.json(apiurl, function(error, json) {
    if (error){ console.log(error) } //are we sure if don't want this to be an IF/ELSE?
    data.read_in(json);

    var tooltip = d3.select('body').append('div').attr("class", "tooltip");
    var canvas = d3.select('#canvas') //a Pointer to newly created svg element
        .append('svg')
        .attr('width', 1000)
        .attr('height', 1000)
        .attr('transform', 'translate(' + margins.canvas_left + ', ' + margins.canvas_top + ')');
                var overview = canvas.append('g')
                .attr('transform', 'translate(' + margins.overview_left + ', ' + margins.overview_top + ')');
                    var electricity_g = overview.append('g')
                    var activities_g = overview.append('g')

                    var electricity_zoom_g = canvas.append('g')
                    .attr('transform', 'translate(' + margins.zoom_left + ', ' + (height.overview + height.spacing + margins.overview_top) + ')');
                        var activities_zoom_g = canvas.append('g')
                        .attr('transform', 'translate(' + margins.zoom_left + ', ' + (height.overview + height.spacing + margins.overview_top + height.zoom + height.activities_bar_spacing_zoom) + ')');

                            //note that if, instead, this was appended to electricity_zoom_g, then the squares would have appeared behind the electricity area

                            var electricity_minimum_reading = 10; //will still use ALL readings to get min/max/av el stats

                            var draw_value_lines = true; //lines of min/max/av values, with annotations
                            var draw_value_points = true; //min/max points with annotations
                            extent = set_master(electricity_minimum_reading);

                            //related functions
                            function get_extent(bounding_extent) {
                                //activity extent is not just [time_first_act, time_last_act], but
                                //[time_first_act-10min, time_last_act+30min], to allow for rectangles to fit properly in the plot
                                var act_times = [];
                                var bounding_min = bounding_extent[0].getTime(),
                                bounding_max = bounding_extent[1].getTime();
                                _.each(data.users, function(user) {
                                    _.each(user.activities, function(act) {
                                        if (act.dt_activity.getTime() <= bounding_max && act.dt_activity.getTime() >= bounding_min) {
                                            act_times.push(act.dt_activity);
                                        }
                                    })
                                })
                                if (act_times) {
                                    var ext = d3.extent(act_times);
                                    var milliseconds_final = ext[1].getTime() + 30*60*1000; //extend time window 30 min to right and 10 min to left
                                    var milliseconds_initial = ext[0].getTime() - 10*60*1000;
                                    var time_initial = new Date(milliseconds_initial);
                                    var time_final = new Date(milliseconds_final);
                                    return [time_initial, time_final];
                                } else {
                                    return false;
                                }
                            }

                            function get_above_min_electricity_extent(el_min) {
                                return d3.extent(data.energy, function(d) {
                                    if (d.watt > el_min) {return d.timestamp }
                                })
                            }
                            function set_master(el_min){
                                var extent_out, extent_el;
                                //
                                //Find out what data there is
                                var el_exists = false, act_exists = false;
                                if(data.meta.period.readings > 0) {
                                    extent_el = get_above_min_electricity_extent(el_min);
                                    if ( (extent_el[1]-extent_el[0]) > 0) {el_exists = true;}
                                }
                                if (el_exists) {
                                    extent_out = extent_el;
                                } else {
                                    extent_out = get_extent();
                                    if (extent_out == false) {
                                        console.log("Nothing to plot: neither activities nor electricity readinds found.");
                                        return 0;
                                    }
                                }
                                return extent_out;
                            }

                            //=========================================


                            //============ Create electricity area graph ============
                            //technically these should be called the overview scales
                            electricityScaleX = d3.time.scale()//scaleLinear()
                                .domain(extent)
                                .range([0, width.electricity]);
                            electricityScaleY = d3.scaleLinear()
                                .domain([0, d3.max(data.energy, function(d) { return d.watt })])
                                //.domain(d3.extent(data.energy, function(d) { return d.watt }))
                                .range([0, height.overview]);


                            // FIRST draw the background colours; electricity will then OVERLAY it
                            //a rectangle showing colour of day during the hours of the experiment (which is assumed to end the following day)
                            f = d3.time.format("%H %M");
                            colour_background({
                                'experiment_start_time':f(extent[0]),
                                'experiment_end_time':f(extent[1]),
                                'width': width.electricity,
                                'height':height.overview,
                                'where':electricity_g
                            });

//Without this the visualisation might not work properly! For some reason.. will get a background shape in electricity.
function compare(a,b) {
  if (a.timestamp < b.timestamp)
    return -1;
  if (a.timestamp > b.timestamp)
    return 1;
  return 0;
}
data.energy.sort(compare);

                            //draw electricity - maybe now should not be making the colour opaque, since then the daylight colour might change it
                            var electricity_area = d3.svg.area()
                                .x(function(d) { return electricityScaleX(d.timestamp); })
                                .y0(function(d) { return electricityScaleY.range()[1] - electricityScaleY(d.watt); })
                                .y1( electricityScaleY.range()[1] )


                                electricity_g.append('path')
                                .datum(data.energy)
                                .attr('class', 'area-energy')
                                .attr('d', electricity_area);


                            //============ Create zoomed electricity area graph ============
                            electricity_zoomScaleX = d3.time.scale()//scaleLinear()
                                .domain(extent)
                                .range([0, width.electricity]);
                            electricity_zoomScaleY = d3.scaleLinear()
                                //.domain(d3.extent(data.energy, function(d) { return d.watt }))
                                .domain([0, d3.max(data.energy, function(d) { return d.watt })])
                                .range([0, height.zoom]);
                            var electricity_zoom_area = d3.svg.area()
                                .x(function(d) { return electricity_zoomScaleX(d.timestamp); })
                                .y0(function(d) { return electricity_zoomScaleY.range()[1]; } )
                                // for smooth transition
                                .y1(function(d) { return electricity_zoomScaleY.range()[1] - electricity_zoomScaleY(d.watt); });


                            var el_zoom_axis = d3.axisBottom()
                                .ticks(2)
                                .tickFormat("") //so that nothing is shown
                                .scale(electricity_zoomScaleX);



                            //necessary so that the plot does not split over the sides
                            electricity_zoom_g.append("clipPath")
                                .attr("id", "clip")
                                .append("rect")
                                .attr("x", 0)
                                .attr("y",  -height.spacing)
                                .attr("width", width.electricity)
                                .attr("height", height.zoom + height.spacing + annotation_peak_radius);

                            //this is actually needed: draggable area is thus the white space behind the zoomed electricity graph. If it's not defined, then even
                            //though electricity_zoom_g can be used to call drag on, clicking on the white area would do nothing - because the only thing
                            //that would appended to the el...zoom_g would be the actual electricity graph
                            var draggable_area = electricity_zoom_g.append('rect').attr('opacity', 0).attr('x', 0).attr('y', 0).attr('width', width.electricity).attr('height', height.zoom);

                            var electricity_graph =  electricity_zoom_g.append('path')
                                .datum(data.energy)
                                .attr('class', 'area-energy')
                                .attr("clip-path", "url(#clip)")
                                .attr('d', electricity_zoom_area)

                                //label the y axis
                                electricity_zoom_g.append('text')
                                .attr('dy', '-0.5em')
                                .attr('dx', -height.zoom/2)  // to match height.electricity_zoom
                                .attr('text-anchor', 'middle')
                                .attr('class', 'energy-y-label')
                                .text(data.meta.labels.y_axis);

                                activities_zoom_g.append('text')
                                .attr('dy', '-0.5em')
                                .attr('dx', '0')  // to match height.electricity_zoom
                                .attr('text-anchor', 'end')
                                .attr('class', 'energy-y-label')
                                .text(data.meta.labels.y_axis2);

                            //adding the hover_over_el->see_the_watt_value functionality
                            var bisectDate = d3.bisector(function(d) { return d.timestamp }).left;
                            electricity_graph.on('mousemove', function(d) {
                                var dayOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                                    var x = d3.mouse(this)[0];
                                var this_time = electricity_zoomScaleX.invert(x);
                                var ind = bisectDate(data.energy, this_time);
                                var y = electricity_zoomScaleY.range()[1] - electricity_zoomScaleY(data.energy[ind].watt)
                                el_reading_rect
                                    .attr("x", x - width.el_reading_boxes/2)
                                    .attr("y", y - height.zoom - height.el_reading_boxes)
                                    .attr("width", width.el_reading_boxes)
                                    .attr("height", height.el_reading_boxes)

                                el_reading_time
                                    .attr("x",x)
                                    .attr('text-anchor', 'middle')            //to appear in the middle of the green box
                                    .attr("y", y - height.zoom - height.el_reading_boxes)
                                    .text(dayOfWeek[this_time.getDay()] +" "+ this_time.getHours() + ":" + ("0" + this_time.getMinutes()).slice(-2))
                                    .style("font-size", "20")
                                el_reading_watt
                                    .attr("x",x)
                                    .attr('text-anchor', 'middle')            //to appear in the middle of the green box
                                    .attr("y", y - height.zoom - height.el_reading_boxes)
                                    .text(data.energy[ind].watt + " Watt")
                                    .style("font-size", "30")
                            })
                            .on('mouseout', function(){
                                el_reading_rect.attr("width", 0).attr("height", 0);
                                el_reading_time.text("")
                                el_reading_watt.text("")
                            })

                            //adding the click_on_electricity->a_form_comes_up functionality
                            electricity_graph.on("click", function() {
                                var this_time = electricity_zoomScaleX.invert(d3.mouse(this)[0]);
                                var ind = bisectDate(data.energy, this_time);
                                var w = data.energy[ind].watt;
                                console.log("Submit appliance use for:")
                                    console.log(this_time)
                                    console.log(" and this el. reading: ")
                                    console.log(w)
                            });


                            //the electricity graph annotations come behind the activities
                            valueLine({ lineValue: data.meta.annotations.avg.Watt, label: 'Average'})//data.meta.annotations.avg.label })
                            valueLine({ lineValue: data.meta.annotations.max.Watt, label: data.meta.annotations.max.label })
                            valueLine({ lineValue: data.meta.annotations.min.Watt, label: data.meta.annotations.min.label })

    function valueLine(value){
        if(draw_value_lines) {
            //have to compute it again here, since json appears to erroneously pass on a too-high value
            if (value.label == "Peak") {
                value.lineValue = d3.max(data.energy, function(d) {return d.watt});
            }
            if ( (value.lineValue <= electricity_zoomScaleY.domain()[1]) && (value.lineValue >= electricity_zoomScaleY.domain()[0]) ) {
                electricity_zoom_g.append('line')
                    .attr('x1', electricity_zoomScaleX.range()[0])
                    .attr('y1', electricity_zoomScaleY.range()[1] - electricity_zoomScaleY(value.lineValue))
                    .attr('x2', electricity_zoomScaleX.range()[1])
                    .attr('y2', electricity_zoomScaleY.range()[1] - electricity_zoomScaleY(value.lineValue))
                    .attr('class', 'annotationline');
                electricity_zoom_g.append('text')
                    .attr('x', electricity_zoomScaleX.range()[1])
                    .attr('y', electricity_zoomScaleY.range()[1] - electricity_zoomScaleY(value.lineValue))
                    .attr('dy', '1em')
                    .attr('text-anchor', 'start')
                    .text(value.label + " (" + value.lineValue + " Watt)")
                    .attr('class', 'annotation');

            }
        }

    }

electricity_zoom_g.append("clipPath")
    .attr("id", "clip_annotations")
    .append("rect")
    .attr("x", -80)
    .attr("y",  -height.spacing)
    .attr("width", width.electricity + 160)
    .attr("height", height.zoom + height.spacing + annotation_peak_radius);

var valuePoints = []
valuePoints.push({ yPoint: data.meta.annotations.max.Watt, xPoint: d3.time.format("%Y-%m-%d %H:%M:%S").parse(data.meta.annotations.max.dt),  label: "Your peak demand"} );
valuePoints.push({ yPoint: data.meta.annotations.min.Watt, xPoint: d3.time.format("%Y-%m-%d %H:%M:%S").parse(data.meta.annotations.min.dt),  label: "Your lowest demand"} );
if (draw_value_points) {
    var myvaluePoints = electricity_zoom_g.selectAll('.rect')
        .data(valuePoints)
        .enter()
        .append('text')
        .attr("clip-path", "url(#clip_annotations)")
        .attr('y', function(d){return electricity_zoomScaleY.range()[1] - electricity_zoomScaleY(d.yPoint);})
        .text(function(d){
            //only make the text appear if the actual point is within the zoomed window
            if (d.xPoint < electricity_zoomScaleX.domain()[1]  &&
                    d.xPoint > electricity_zoomScaleX.domain()[0]) {
                return d.label;
            } else {return "";}
        })
    .attr('dy', '-0.5em')
        .attr('text-anchor', 'middle')
        .attr('class', 'annotation-peak');

    var myvaluePointsCircles = electricity_zoom_g.selectAll('.circ')
        .data(valuePoints)
        .enter()
        .append('circle')
        .attr("clip-path", "url(#clip)")
        .attr('cy', function(d){return electricity_zoomScaleY.range()[1] - electricity_zoomScaleY(d.yPoint);})
        .attr('cx', function(d){return electricity_zoomScaleX(d.xPoint);})
        .attr('r', annotation_peak_radius)
        .attr('class', 'annotation-peak-circles');
}



//============ Create activities graph ============
process_activities();
function process_activities() {
    data.activities = []
        var periods = {}
    _.each(data.users, function(user){
        _.each(user.activities,function(act){
            if((act.dt_activity >= electricityScaleX.domain()[0]) && (act.dt_activity <= electricityScaleX.domain()[1])){
                var bin = act.period+'_'+act.idMeta;
                if(!periods.hasOwnProperty(bin)) periods[bin] = {
                    "dt_period": act.dt_period,
                    "idMeta": act.idMeta,
                    //"dotcolour": act.dotcolour,
                    "category": act.category,
                    "activities": []    }
                data.activities.push(act)
                    periods[bin].activities.push(act)
            }
        })
    })
    data.periods = []
        _.each(periods,function(period){ data.periods.push(period) })
}


//draw activity periods
act_per = create_activity_periods();
compute_activity_periods_visuals(act_per, electricityScaleX.domain(), "normal");

function create_activity_periods() {
    var activity_periods = [], next_activity;
    data.periods.forEach(function(this_activity){
        next_activity = find_next_user_activity(this_activity);
        if (next_activity) {
            var activity_period = {
                "bounding_activities_full":[this_activity, next_activity],
                "bounding_activities":[this_activity.activities[0].activity, next_activity.activities[0].activity],
                "location":this_activity.activities[0].location_label
            }
            activity_periods.push(activity_period);
        }
    })
    return activity_periods;
}

function compute_activity_periods_visuals(activity_periods, domain, graph) {
    var xmin = domain[0];
    var xmax = domain[1];
    var this_activity, next_activity, this_activity_time, next_activity_time, act_period_lhs, act_period_rhs;
    activity_periods.forEach(function(act_period){
        this_activity = act_period["bounding_activities_full"][0];
        next_activity = act_period["bounding_activities_full"][1];
        this_activity_time = this_activity.dt_period;
        next_activity_time = next_activity.dt_period;
        if ( (next_activity_time > xmin) && (this_activity_time < xmax)) {
            act_period_lhs = (this_activity_time < xmin) ? xmin : this_activity_time;
            act_period_rhs = (next_activity_time > xmax) ? xmax : next_activity_time;
            if (graph != "zoom") {
                act_period["x"] = electricityScaleX(act_period_lhs);
                act_period["width"] = (electricityScaleX(act_period_rhs) - electricityScaleX(act_period_lhs));
                act_period["y"] = (data.meta.users.indexOf(this_activity.idMeta))*(height.activities_bar + height.activities_bar_spacing);
                act_period["height"] = height.activities_bar;

            } else {
                act_period["x"] = electricity_zoomScaleX(act_period_lhs);
                act_period["width"] = (electricity_zoomScaleX(act_period_rhs) - electricity_zoomScaleX(act_period_lhs));
                act_period["y"] = (data.meta.users.indexOf(this_activity.idMeta))*(height.activities_bar_zoom + height.activities_bar_spacing_zoom);
                act_period["height"] = height.activities_bar_zoom;
            }
        } else {
            act_period["height"] = 0;
        }
    })
}

function find_next_user_activity(d) { //for when d is an element of data.periods
    var next_user_activity = false;
    var time_next_activity = electricityScaleX.domain()[1]; //Since have to look outside the zoomed-in area as well
    data.periods.forEach(function(g) {//Note here we search through ALL the activity list, not just the domain of this graph.
        //If searching within this domain, use "data.periods.forEach"
        if (g.idMeta == d.idMeta) {
            if ( (g.dt_period > d.dt_period) &&
                    (g.dt_period <= time_next_activity) ) {
                time_next_activity = g.dt_period;
                next_user_activity = g;
            }
        }
    })
    return next_user_activity;
}

    var activities_periods = activities_g.selectAll('.activity_periods')
    .data(act_per)
.enter()
    .append('rect')
    .attr('class', 'act_periods')
    .attr('width', function(d){return d.width})
    .attr('x', function(d){return d.x})
    .attr('height', function(d){return d.height})
    .attr('y', function(d){return d.y})
    .attr('class', function(d){return (d.location == "Home") ? "home" : "away"})




    //draw activities
    var activities_instances = activities_g.selectAll('activities_instances')
    .data(data.periods)
.enter()
    .append('g')

    //deliberately with no hover functionality
    activities_instances.append('rect')
    .attr('width', 10 )
    .attr('x', function(d) {return electricityScaleX( d.dt_period ) })
    .attr('height', height.activity)
    .attr('y', function(d) {
        var ind = data.meta.users.indexOf(d.idMeta);
        return ind*(height.activities_bar + height.activities_bar_spacing) + (height.activities_bar - height.activity)/2.0;
    } )
.attr("rx", 3)
.attr("ry", 3)
.attr("class", function(d) {
    if (d.category.length == 0) {return "other_category"}
    else {return d.category}
})


var overview_labels_loc_brief = ['00 00', '06 00', '12 00', '18 00']; //this is explicit for greater control
var my_overview_labels = append_labels(overview_labels_loc_brief, activities_g, electricityScaleX);

//============ Create zoomed activities graph ============
//draw activity periods
act_per_zoom = create_activity_periods();//technically not needed - but it is this variable's internal variables that
//will get reassigned (x, width, etc.) whenever the zoomed-in area changes - and not the variables of the main, top activities
//plot. We'll not be plotting the top plot again, so we don't care if they get reassigned, but still.
compute_activity_periods_visuals(act_per_zoom, electricity_zoomScaleX.domain(), "zoom");

    var activities_periods_zoom = activities_zoom_g.selectAll('.activity_periods_zoom')
    .data(act_per_zoom)
.enter()
    .append('g')

    var myrects = activities_periods_zoom.append('rect')
    .attr('class', 'act_per_zoom_rect')
    .attr('width', function(d){return d.width})
    .attr('x', function(d){return d.x})
    .attr('height', function(d){return d.height})
    .attr('y', function(d){return d.y})
    .attr('class', function(d){return (d.location == "Home") ? "home" : "away"})


    myrects.on("click", function(d) {
        console.log("Submit activity for user ");
        var user = d["bounding_activities_full"][0].idMeta;
        console.log(user);
    })

//draw activities
    var zoom_activities_instances = activities_zoom_g.selectAll('zoom_activities_instances')
    .data(data.periods)
.enter()
    .append('g')
    //necessary so that the plot does not split over the sides
    activities_zoom_g.append("clipPath")
    .attr("id", "activities_clip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width.electricity)
    .attr("height", height.zoom);

    var zoom_labels_loc_brief = ['00 00', '04 00', '06 00', '09 00', '12 00', '15 00', '18 00', '21 00']; //this is explicit for greater control
    var my_zoom_labels = append_labels(zoom_labels_loc_brief, electricity_zoom_g, electricity_zoomScaleX);


    function append_labels(location_brief, group, scale) {
        var labels_format = d3.timeFormat("%H %M");
        var labels_loc = []; //we define it here, but it will be appended as data
        _.each(data.timestamps, function(g) {
            if (location_brief.includes(labels_format(g)) ) {
                labels_loc.push(g);
            }
        })
        var labels = group.selectAll('labels')
            .data(labels_loc)
            .enter()
            .append('g')



            var my_labels = [];
        //different formatting in 'overview' and 'zoom' graphs
        if (scale == electricity_zoomScaleX) {
            //adding this weird clippath works. Other, normal clip paths don't. I don't know why.
            group.append("clipPath")
                .attr("id", "temp")
                .append("rect")
                .attr("x", 0)
                .attr("y", -100)//Without this, does not work
                .attr("width", width.electricity)
                .attr("height",height.zoom)

                labels.attr("transform", "translate(0," + (height.zoom - 5) + ")"); //puts labels near the bottom of the graph
            var my_labels_hour = labels.append("text")
                .attr("clip-path", "url(#temp)")
                .attr('x', function(d) {return scale(d); }) //x is set explictly, at each text (hour and am/pm),
            //rather than doing the overall transform on g, since when the zoom window moves the corresponding
            //transform would have had to be computed as the difference, rather than an absolute scalex value as done now
            .style("font-size", "80")
                .style("fill","#666")
                .style("text-anchor", "end")
                .text(function(d){
                    var format = d3.time.format('%-I %p');
                    var out = (format(d)).split(" ", 2);
                    var date = out[0];
                    return date;
                })
            my_labels.push(my_labels_hour);
            var my_labels_ampm = labels.append("text")
                .attr("clip-path", "url(#temp)")
                .attr('x', function(d) {return scale(d); })
                .style("text-anchor", "start")
                .style("font-size", "20")
                .attr("fill","#666")
                .text(function(d){
                    var format = d3.time.format('%-I %p');
                    var out = (format(d)).split(" ", 2);
                    var date = out[1].toLowerCase();
                    return date;
                })
            my_labels.push(my_labels_ampm);
        } else {
            var format = d3.time.format('%-I %p');
            var format_weekday = d3.time.format('%-A');
            labels.attr('transform', function(d){
                return 'translate(' + scale(d) + ', ' + ( (format(d) == "12 AM")?'-2)':( (height.overview/2 ) + '), rotate(-90 )'));
            }) //this way each label gets rotated individually
            var my_labels_complete = labels.append("text")
                .style("text-anchor", function(d){
                    return ( (format(d) == "12 AM")?"start":"middle" );
                })
            .text(function(d){
                return ( (format(d) == "12 AM")?format_weekday(d):format(d));})
                .style("font-size", "20")
                .attr("fill","#666")

                my_labels.push(my_labels_complete);
        }

        return my_labels;
    }




//add labels to user activities bars
_.each(data.users, function(user){
    var ind = data.meta.users.indexOf(user.idMeta);
    var h = ind*(height.activities_bar_zoom + height.activities_bar_spacing_zoom);
    activities_zoom_g.append('text')
        .attr('x', 2)
        .attr('y', h)
        .attr('dy', '1em')
        .attr('text-anchor', 'start')
        .text(user.label)
        .attr('fill', user.dotcolour)
        .attr('class', 'userLabel');
})

//add activity rectanges
var activity_rects = zoom_activities_instances.append('rect')
.attr("class", function(d) {
    if (d.category.length == 0) {return "other_category"}
    else {return d.category}
})
.attr("clip-path", "url(#activities_clip)")
.attr('width', 20 )
.attr('x', function(d) {
    if (d.dt_period == electricity_zoomScaleX.domain()[1]) {
        return electricity_zoomScaleX( d.dt_period ) - 20;
    }
    return electricity_zoomScaleX( d.dt_period ) })
.attr('height', height.activity_zoom)
.attr('y', function(d) {
    var ind = data.meta.users.indexOf(d.idMeta);
    return ind*(height.activities_bar_zoom + height.activities_bar_spacing_zoom) + (height.activities_bar_zoom - height.activity_zoom)/2.0;
} )
.attr("rx", 3)
.attr("ry", 3)


//enjoyment icons on activity boxes
var enjoyment_icons = zoom_activities_instances.append('image')
.attr("clip-path", "url(#activities_clip)")
.attr("xlink:href", function(d) {
    var out = "img/enjoy_" + ((d.activities[0].enjoyment!='undefined')?d.activities[0].enjoyment:"0") + ".png";
    return out;
})
.attr("x", function(d) { return electricity_zoomScaleX( d.dt_period ) })
.attr("y", function(d) {
    var ind = data.meta.users.indexOf(d.idMeta);
    return ind*(height.activities_bar_zoom + height.activities_bar_spacing_zoom) - 3;
} )
.attr("width", '20')
.attr("height", '20')
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
.on("click", function(d){console.log(d)})






//ONLY THE ONE BOX!!! :))))))
var el_reading_box = activities_zoom_g.append('g').attr('opacity',1); //append to the activity zoom graph so as to see the reading _over_ the activity lines and boxes
var el_reading_rect = el_reading_box.append('rect')
.attr("width", 0)
.attr("height", 0)
.attr("rx", 15)
.attr("ry", 15)
.attr("opacity", 0.5)
.attr("fill", '#999');

var el_reading_time = el_reading_box.append('text')
.attr('dy', '1.5em')
.attr('text-anchor', 'start')
.attr('fill', '#003300')
.text("");

var el_reading_watt = el_reading_box.append('text')
.attr('dy', '2.5em')
.attr('text-anchor', 'start')
.attr('fill', '#003300')
.text("");


//.attr("pointer-events", "none") //not important


//============= Rectangles with arrows appearing on the sides on hovering =============
// ============= Uncomment, and assign the 'g' elements 'onclick' or 'onmousedown' events
// function triangle(a_h, a_w, orientation) { //orientation "right" for right-facing, anything else for left-facing
//     return [{x:0, y:0}, {x:0, y:(a_h)}, {x:a_w*((orientation == "right")?1:(-1)), y:a_h/2.0}, {x:0, y:0}]
// }
// var a_h = 20, a_w = 20, ssb_width = 50, ssb_height = height.zoom;
// var ssb = activities_zoom_g.selectAll('.scroll_side_bars')
//                                                      .data([triangle(a_h, a_w, "left"), triangle(a_h, a_w, "right")])
//                                                      .enter()
//                                                        .append('g')
//                                                      .attr('transform', function(d, i) {
//                                                          return 'translate(' + ( (i == 0)?0:(width.electricity-ssb_width) ) + ',0)';
//                                                      })
//                                                      .attr("opacity", 0);
// var scroll_rects = ssb.append('rect')
//         .attr('x', 0)
//         .attr('y', 0)
//         .attr('width', ssb_width)
//         .attr('height', ssb_height)
//         .attr('fill', 'lightgrey')
//
// var lineFunction = d3.svg.line()
//                                                      .x(function(d) { return d.x; })
//                                                     .y(function(d) { return d.y; })
//                                                     .interpolate("linear");
// ssb.append('path')
//         .attr('transform', function(d, i) {
//             var x_offset = (i == 0)?( (ssb_width-a_w)/2.0 + a_w ):(ssb_width-a_w)/2.0;
//             return 'translate(' + x_offset + ', ' + (ssb_height-a_h)/2.0 + ')';
//         })
//         .attr('d', function(d){return lineFunction(d)})
//         .attr("stroke", "blue")
//         .attr("stroke-width", 2)
//         .attr("fill", "blue");
//
//     ssb.on('mouseenter',function() {
//                 d3.select(this).transition().duration(500).attr('opacity', 0.5)
//         })
//      .on('mouseleave',function () {
//                 d3.select(this).transition().duration(500).attr('opacity', 0)
//             })
//=================================================================








//======================== ZOOM, and related ========================
make_brush();
function make_brush(){
    brush = d3.svg.brush()
        .x(electricityScaleX)
        .extent(DefineExtent(data.meta.period.max))
        .on("brush", brushed);

    //First, append the opaque blocks to left and right of brush
    var brush_opaque = activities_g.selectAll(".rect")
        .data([brush.extent()[0],brush.extent()[1]])
        .enter()
        .append("g")
        .attr("class", "brush_opaque_g")

        brush_opaque.append("rect")
        .attr("class", "brush_opaque")
        .attr("x", function(d, i) {
            return (i == 0) ? electricityScaleX.range()[0] : electricityScaleX(d);
        })
    .attr("y", 0)
        .attr("width", function(d, i) {
            return (i == 0) ? (electricityScaleX(d) - electricityScaleX.range()[0]) :
                (electricityScaleX.range()[1] - electricityScaleX(d))
        })
    .attr("height",height.overview)

        brush_opaque.append("line")
        .attr("class", "brush_opaque_lines")
        .attr("x1", function(d) { return electricityScaleX(d) })
        .attr("y1", function(d) { return height.overview })
        .attr('x2', function(d, i) { return electricity_zoomScaleX.range()[i] })
        .attr("y2", function(d) { return height.overview + height.spacing })

        //this defines a clickable area, where clicking moves the brush to center
        //around that point. It has to be defined before the brush rect, so as not
        //to overlay the brush rect
        var clickableBrushArea = activities_g.append("rect")
        .attr('class', 'background')
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", height.overview)
        .attr("opacity", 0)
        .attr("width", width.electricity)
        .on('click', function(){
            var a = DefineExtent(electricityScaleX.invert(d3.mouse(d3.event.target)[0]));
            brush.extent(a);
            brush(d3.select(".brush").transition().duration(500));
            electricity_zoomScaleX.domain(brush.empty() ? electricityScaleX.domain() : brush.extent());
            electricity_zoom_g.select(".area-energy").transition().duration(1000).attr("d", electricity_zoom_area);
            activity_rects.transition().duration(1000).attr('x', function(d) { return electricity_zoomScaleX( d.dt_period ) })
                brush_opaque.data([brush.extent()[0],brush.extent()[1]])
                brush_opaque.select(".brush_opaque").transition().duration(200).attr("x", function(d, i) {return (i == 0) ? electricityScaleX.range()[0] : electricityScaleX(d);}).attr("width", function(d, i) {return (i == 0) ? (electricityScaleX(d) - electricityScaleX.range()[0]) : (electricityScaleX.range()[1] - electricityScaleX(d))})
                brush_opaque.select(".brush_opaque_lines").transition().duration(200).attr("x1", function(d) { return electricityScaleX(d) }).attr('x2', function(d, i) { return electricity_zoomScaleX.range()[i] })
                compute_activity_periods_visuals(act_per_zoom, electricity_zoomScaleX.domain(), "zoom");
            myrects.transition().duration(1000).attr('width', function(d){return d.width})
                .attr('x', function(d){return d.x})
                .attr('height', function(d){return d.height})
                .attr('y', function(d){return d.y})
                _.each(my_zoom_labels, function(label){label.transition().duration(1000).attr('x', function(d){return electricity_zoomScaleX(d);})})
                electricity_zoom_g.selectAll('.annotation-peak').transition().duration(1000).attr('x', function(d){return electricity_zoomScaleX(d.xPoint);})
                .text(function(d){
                    //only make the text appear if the actual point is within the zoomed window
                    if (d.xPoint < electricity_zoomScaleX.domain()[1]  &&
                            d.xPoint > electricity_zoomScaleX.domain()[0]) {
                        return d.label;
                    } else {return "";}
                })
            electricity_zoom_g.selectAll('.annotation-peak-circles').transition().duration(1000).attr('cx', function(d){return electricity_zoomScaleX(d.xPoint);})
                enjoyment_icons.transition().duration(1000).attr('x', function(d) { return electricity_zoomScaleX( d.dt_period ) })
        })

    activities_g.append("g")
        .attr("class", "brush")
        .call(brush)
        .selectAll("rect")
        .attr('id', 'mybrush')
        .style('stroke', 'grey')
        .attr("y", -1)//6)
        .attr("height", height.overview + 1)
        brushed(); //so that the zoomed in plot shows the initial zoomed in area

    function brushed() {
        electricity_zoomScaleX.domain(brush.empty() ? electricityScaleX.domain() : brush.extent());
        electricity_zoom_g.select(".area-energy").attr("d", electricity_zoom_area);
        activity_rects.attr('x', function(d) { return electricity_zoomScaleX( d.dt_period ) })
            enjoyment_icons.attr('x', function(d) { return electricity_zoomScaleX( d.dt_period ) })
            brush_opaque.data([brush.extent()[0],brush.extent()[1]]);
        brush_opaque.select(".brush_opaque").attr("x", function(d, i) {
            return (i == 0) ? electricityScaleX.range()[0] : electricityScaleX(d);
        })
        .attr("width", function(d, i) {
            return (i == 0) ? (electricityScaleX(d) - electricityScaleX.range()[0]) :
                (electricityScaleX.range()[1] - electricityScaleX(d))
        })
        brush_opaque.select(".brush_opaque_lines").attr("x1", function(d) { return electricityScaleX(d) })
            .attr('x2', function(d, i) { return electricity_zoomScaleX.range()[i] })
            // brush_opaque.select(".brush_opaque_lines").attr("x1", function(d, i) { return ((i == 0)?d3.select('.brush .extent').property('x').baseVal.value:(d3.select('.brush .extent').property('x').baseVal.value + d3.select('.brush .extent').property('width').baseVal.value)); })
            // .attr('x2', function(d, i) { return electricity_zoomScaleX.range()[i] })
            compute_activity_periods_visuals(act_per_zoom, electricity_zoomScaleX.domain(), "zoom");
        //activities_periods_zoom.data(act_per_zoom);
        myrects.attr('width', function(d){return d.width})
            .attr('x', function(d){return d.x})
            .attr('height', function(d){return d.height})
            .attr('y', function(d){return d.y})
            //!The code below 'manually' sets the LHS of the rectangle associated with the brush to the LHS of it's extent. Works great.
            d3.select('.brush .extent').attr('x', electricityScaleX(brush.extent()[0]))
            //brush(d3.select(".brush")); //Whereas this code somehow does it automatically. But! it lags!!! So use the code above.
            //my_zoom_labels.attr('x', function(d){return electricity_zoomScaleX(d);})
            _.each(my_zoom_labels, function(label, index){label.attr('x', function(d){
                return electricity_zoomScaleX(d); })})
            electricity_zoom_g.selectAll('.annotation-peak').attr('x', function(d){return electricity_zoomScaleX(d.xPoint);})
            .text(function(d){
                //only make the text appear if the actual point is within the zoomed window
                if (d.xPoint < electricity_zoomScaleX.domain()[1]  &&
                        d.xPoint > electricity_zoomScaleX.domain()[0]) {
                    return d.label;
                } else {return "";}
            })
        electricity_zoom_g.selectAll('.annotation-peak-circles').attr('cx', function(d){return electricity_zoomScaleX(d.xPoint);})
    }

    //=============== Dragging functionality ===============
    var x0;
    var drag = d3.drag()
        .on("drag", dragmove)
        .on("start", initialise_coords)
        function initialise_coords() {
            x0 = d3.event.x;
            el_reading_rect.attr("width", 0).attr("height", 0);
            el_reading_time.text("")
            el_reading_watt.text("")
        }
    function dragmove(d) {
        var x = d3.event.x;
        var time_in_brush = brush.extent()[1]-brush.extent()[0];
        var time_in_total = electricityScaleX.domain()[1] - electricityScaleX.domain()[0];
        var fraction_time_in_brush = time_in_brush/time_in_total;
        var diff = x - x0;
        var range_move = width.electricity;
        var fraction_dragged = diff/range_move;
        var new_time_left = brush.extent()[0] - fraction_dragged*time_in_brush;
        var new_time_right = new_time_left + time_in_brush;
        if ( (electricityScaleX.domain()[0] < new_time_left) && (electricityScaleX.domain()[1] > new_time_right)) {
            brush.extent([new_time_left, new_time_right]);
            brushed();
        }
        x0 = x;
    }
    activities_zoom_g.call(drag);
    electricity_zoom_g.call(drag);

    //============================================================

    function DefineExtent(timestamp) {
        var center = timestamp.getTime();
        var hhf = 180*60*1000 // three hours (180min)
            //1. Check if 'timestamp', around which the window is meant to be centered, is outside the x-axis extent
            if (center < (extent[0])) {
                var from = extent[0];
                var to = extent[0] + 2*hhf;
            } else {
                if (center > (extent[1])) {
                    var from = extent[1] - 2*hhf;
                    var to = extent[1];
                } else {
                    // return 'from to' positions for brush to fit around the timestamp
                    var from = center - hhf
                        var to = center + hhf
                }
            }
        var end = extent[1].getTime();//data.meta.period.end.getTime()
        var start = extent[0].getTime();//data.meta.period.start.getTime()
        if(to > end){
            var from = end - ( 2 * hhf )
                var to = end}

        if(from < start){
            var from = start
                var to = start + ( 2 * hhf ) }

        from = new Date(from)
            to = new Date(to)

            return [from,to]
    } // end recenter

}
//========================================================================




function toolbox_label(d){
    // populate the activity box
    var html = formatDayTime(d.dt_period)
        _.each(d.activities,function(act){
            var enjoy    = "<img src=img/enjoy_"+((act.enjoyment!='undefined')?act.enjoyment:"0")+".png width='40px' height='40px'>"
            var location = "<img src=img/location_"+((act.location!='undefined')?act.location:"0")+".png width='40px' height='40px'>"
            html += '<br> '+location+' '+enjoy+' ' +act.activity
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





//====== to draw daylight background ======
function colour_background(specs) {

    reference_time_array = create_reference_time_array(specs.experiment_start_time, specs.experiment_end_time); //indexed by experimental time, value gives reference (absolute wrt 24 hours) time
    daylight = create_daylight_minute_array(); //independent of data for now. Uses preset times for dawn and dusk
    dd = assign_colour_rectangles(reference_time_array, daylight);

    absolute_timescale_X = d3.scaleLinear()
        .domain([0, reference_time_array.length])
        .range([0, specs.width]);

    function daylight_rect(d, scaleX) {
        return [{x:scaleX(d.start_min), y:0}, {x:scaleX(d.start_min), y:specs.height}, {x:scaleX(d.end_min), y:specs.height}, {x:scaleX(d.end_min), y:0}]
    }
    var lineFunction = d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .interpolate("linear");
    specs.where.selectAll('.daytime_rects')
        .data(dd)
        .enter()
        .append('path')
        .attr('d', function(d){
            var myrect = daylight_rect(d, absolute_timescale_X);
            return lineFunction(myrect)})
        .attr("fill", function(d){ return d3.rgb(d.colour[0], d.colour[1], d.colour[2]); })
        .attr("stroke", function(d){ return d3.rgb(d.colour[0], d.colour[1], d.colour[2]); }) //!important here!
}

function create_reference_time_array(initial_time, end_time) {
    //assumes max span is 2 days
    var initial_minute = (+initial_time.substr(0,2)*60) + (+initial_time.substr(2,3)),
    end_minute = (+end_time.substr(0,2)*60) + (+end_time.substr(2,3));
    var reference_time = [];
    for (var i = initial_minute; i < 24*60; i++) { reference_time.push(i); }
    for (var i = 0; i < end_minute; i++) { reference_time.push(i); }
    return reference_time;
}

function assign_colour_rectangles(ref_array, daylight_sequence) {
    //takes a sequence of absolute minutes (our_array = e.g. 1339, 0, 1, 2) and creates a sequence of rectangles defined by daylight colours
    //daylight_sequence is an array of daylight colour associated with absolute minute given by the index of that colour
    var out = [];
    var start_min = 0;
    var this_colour = daylight_sequence[ref_array[start_min]];
    for (var i = 1; i < ref_array.length; i++) {
        if (daylight_sequence[ref_array[i]] != this_colour) {
            out.push({
                'start_min':start_min,
                'end_min':i,
                'colour':this_colour
            });
            start_min = i;
            this_colour = daylight_sequence[ref_array[i]];
        } else {
            if (i == (ref_array.length - 1) ) {
                out.push({
                    'start_min':start_min,
                    'end_min':i,
                    'colour':this_colour
                });
            }
        }
    }
    return out;
}

function create_daylight_minute_array() {
    //function returns a 60*24 array of colours, indexed by absolute minutes, starting from midnight
    var dawn = ['06 00', '08 00'], dusk = ['18 00', '20 00'];
    var colour_day_time = [235,215,159], colour_night_time = [117, 117, 187];

    //absolute minute
    var dawn_start = (+dawn[0].substr(0,2)*60) + (+dawn[0].substr(2,3)),
    dawn_end = (+dawn[1].substr(0,2)*60) + (+dawn[1].substr(2,3)),
    dusk_start = (+dusk[0].substr(0,2)*60) + (+dusk[0].substr(2,3)),
    dusk_end = (+dusk[1].substr(0,2)*60) + (+dusk[1].substr(2,3)),
    dawn_length = dawn_end - dawn_start,
    dusk_length = dusk_end - dusk_start;

    var range_R = colour_day_time[0] - colour_night_time[0];
    var range_B = colour_day_time[1] - colour_night_time[1];
    var range_G = colour_day_time[2] - colour_night_time[2];
    var num_bits_dawn = dawn_length - 1;
    var num_bits_dusk = dusk_length - 1;
    var inc_R_dawn = range_R/num_bits_dawn;
    var inc_B_dawn = range_B/num_bits_dawn;
    var inc_G_dawn = range_G/num_bits_dawn;
    var inc_R_dusk = range_R/num_bits_dusk;
    var inc_B_dusk = range_B/num_bits_dusk;
    var inc_G_dusk = range_G/num_bits_dusk;

    var daylight_colours = [];
    var day_length = 24*60;
    for (var i = 0; i < dawn_start; i++) { daylight_colours.push(colour_night_time); };
    for (var i = 0; i < dawn_length; i++) {
        var new_R = colour_night_time[0] + i*inc_R_dawn;
        var new_B = colour_night_time[1] + i*inc_B_dawn;
        var new_G = colour_night_time[2] + i*inc_G_dawn;
        daylight_colours.push([new_R, new_B, new_G]);
    };
    for (var i = 0; i < (dusk_start - dawn_end); i++) { daylight_colours.push(colour_day_time); };
    for (var i = 0; i < dusk_length; i++) {
        var new_R = colour_day_time[0] - i*inc_R_dusk;
        var new_B = colour_day_time[1] - i*inc_B_dusk;
        var new_G = colour_day_time[2] - i*inc_G_dusk;
        daylight_colours.push([new_R, new_B, new_G]);
    };
    for (var i = 0; i < (24*60 - dusk_end); i++) { daylight_colours.push(colour_night_time); };
    return daylight_colours;
}

})
