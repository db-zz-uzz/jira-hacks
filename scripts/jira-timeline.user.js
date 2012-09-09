// ==UserScript==
// @name        jira-issue-timeline
// @description Draw timeline for issue.
// @include     http://jira.zoran.com/browse/*
// @version     0.1
// @grant 		none
// ==/UserScript==

(function () {

	/**
	* Returns the week number for this date. dowOffset is the day of week the week
	* "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
	* the week returned is the ISO 8601 week number.
	* @param int dowOffset
	* @return int
	*/
	Date.prototype.getWeek = function (dowOffset) {
		/*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.epoch-calendar.com */

		dowOffset = typeof(dowOffset) == 'int' ? dowOffset : 0; //default dowOffset to zero
		var newYear = new Date(this.getFullYear(),0,1);
		var day = newYear.getDay() - dowOffset; //the day of week the year begins on
		day = (day >= 0 ? day : day + 7);
		var daynum = Math.floor((this.getTime() - newYear.getTime() -
			(this.getTimezoneOffset()-newYear.getTimezoneOffset())*60000)/86400000) + 1;
		var weeknum;
		//if the year starts before the middle of a week
		if(day < 4) {
			weeknum = Math.floor((daynum+day-1)/7) + 1;
			if(weeknum > 52) {
				nYear = new Date(this.getFullYear() + 1,0,1);
				nday = nYear.getDay() - dowOffset;
				nday = nday >= 0 ? nday : nday + 7;
				/*if the next year starts before the middle of
				the week, it is week #1 of that year*/
				weeknum = nday < 4 ? 1 : 53;
			}
		}
		else {
			weeknum = Math.floor((daynum+day-1)/7);
		}
		return weeknum;
	};

	function line_weight( in_progress )
	{
		console.info("line_weight ", in_progress);
		return (in_progress ? 16 : 6);
	}

	function assignee_color( index )
	{
		var colors = [
			"#AB44F1",
			"#E73813",
			"#48A8DA",
			"#44F14B",
			"#E7CB41",
			"#C0C454",
			"#5C915D",
			"#38BF98",
			"#3C3734",
			"#8C7E4E",
		];

		// stub for assignee count > 10
		return (index >= colors.length) ? "#000000" : colors[index];
	}

	function create_element(elm_tag, elm_class, elm_id)
	{
        var elm = document.createElement(elm_tag);
        if ( elm_class != null )
        {
        	elm.setAttribute("class", elm_class);
    	}
       	if ( elm_id != null )
       	{
       		elm.id = elm_id;
       	}
        return elm;
	}

    function add_css( cssCode )
    {
        var styleElement = document.createElement("style");
        styleElement.type = "text/css";
        if (styleElement.styleSheet) 
        {
            styleElement.styleSheet.cssText = cssCode;
        } 
        else 
        {
            styleElement.appendChild(document.createTextNode(cssCode));
        }
        document.getElementsByTagName("head")[0].appendChild(styleElement);
    }

    function jira_date_parse( date_str )
    {
    	var t_pos = date_str.indexOf("T");
    	var msec_pos = date_str.indexOf(".");
    	// do not take GMT offset into account for now

    	var date_val = date_str.substring(0, t_pos).split("-");
    	var time_val = date_str.substring(t_pos+1, msec_pos).split(":");
    	var msec_val = date_str.substring(msec_pos + 1, msec_pos+4);

    	var datetime = new Date( date_val[0], date_val[1]-1, date_val[2],
    							time_val[0], time_val[1], time_val[2], 
    							msec_val );

    	return datetime;
    }

    function json_issue_addr()
    {
    	return "http://jira.zoran.com/rest/api/latest/issue/" + document.getElementById("key-val").innerHTML + "?expand=changelog";
    }

    // extract assignee chang and work start/stop events from log.
    function get_main_line_events( changes )
    {
  		var events = new Array();
    	var histories = changes.histories;

    	//for ( var eventId = 0; eventId < changes.total; iventId++ )
    	for ( var eventId in histories )
    	{
    		//for ( var changeId = 0; changeId < histories[eventId].items.length; changeId++ )
    		for ( var changeId in histories[eventId].items )
    		{
    			var change = histories[eventId].items[changeId];
    			// 3 is ID of "In Progress" status
    			if ( ( change.field == "assignee" ) || 
    				 ( (change.field == "status") && ( (change.from == 3) || (change.to == 3) ) ) )
    			{
    				events.push({
    					authorName: histories[eventId].author.displayName,
    					change:     change,
    					created:    histories[eventId].created,
    				});
    			}
    			//console.info( histories[eventId].author.displayName + " " + change.field 
    			//			+ ": " + change.fromString + " -> " + change.toString );
    		}
    	} 	
    	return events;
    }

    function get_left_pos( event_time, issue_created, now_date, image_width )
    {
    	var event_scale = ( issue_created.getTime() - event_time.getTime() ) / ( issue_created.getTime() - now_date.getTime() );
    	var pos = ( image_width * event_scale );
    	return pos;
    }

    function draw_main_event( paper, event, line, image_width, image_height )
    {
    	console.info( line );
    	var path_str = "M "+ line.start + " " + (image_height / 2) + " L " + line.end + " " + (image_height / 2);
    	console.info( path_str );
    	paper.path( path_str ).attr({stroke: line.color, 
    								"stroke-width": line.weight, 
    								 });
    }

    function draw_timeline( data )
    {
    	var image_width = jQuery("#timeline-content").width();
    	var image_height = 200;
		var paper = new Raphael( document.getElementById("timeline-content"), image_width, image_height );

		var issue = data.fields;
		var log = data.changelog;

		var createdDate = jira_date_parse(issue.created);
		var nowDate = new Date();

		// calc width of day in pixels
		var days_old = Math.ceil( (nowDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24) );

		var day_pix = image_width / days_old;
		
		// get next monday's timestamp
		// shift days to maynday be 0
		var created_day = createdDate.getDay();
		if ( created_day == 0 )
		{
			created_day = 6;
		}
		else
		{
			created_day = created_day - 1;
		}

		var next_monday_ts = createdDate.getTime() + ( (7 - created_day) * (1000 * 60 * 60 * 24) );

		// draw week lines & week names		
		{
			var week_lines_arr = new Array();
			// first week
			week_lines_arr[0] = {left: 0, name: "WW-"+createdDate.getWeek()};

			var left = (7 - created_day) * day_pix;
			for( var ts = next_monday_ts; ts < nowDate.getTime(); ts += 1000 * 60 * 60 * 24 * 7)
			{
				var date = new Date(ts);
				week_lines_arr.push({left: left, name: "WW-" + date.getWeek()});

				paper.path("M "+left+" 0 L "+left+" "+(image_height)).attr({stroke: "#DDDDDD"});

				left += day_pix * 7;
			}

			week_lines_arr.push({left: image_width, name: "last"});

			for ( var i = 0; i < week_lines_arr.length - 1; i++ )
			{
				paper.text( (week_lines_arr[i].left + week_lines_arr[i+1].left)/2, image_height - 5, 
							week_lines_arr[i].name
						).attr({ "font-size": 10, "font-family": "Arial, Helvetica, sans-serif", fill: "#666" });
			}
		}

		// main line events such as assignee change and start/stop work
		var main_line_events = get_main_line_events( log );
		//console.info( main_line_events );

		// back traverse and draw main line
		{
			var assignee_count = 0;
			var line = { start: image_width, 
						end: 0, 
						weight: line_weight( issue.status.id == 3 ), 
						color: assignee_color( assignee_count ) };
			var color_list = {};
			var key = issue.assignee.name;
			color_list[key] = assignee_color(assignee_count);

			for ( var eventId = main_line_events.length - 1; eventId > -1; eventId-- )
			{
				//console.info( main_line_events[eventId] );
				if ( main_line_events[eventId].change.field == "assignee" )
				{
					line.end = get_left_pos( jira_date_parse( main_line_events[eventId].created ),
											createdDate, nowDate, image_width );

					// draw here
					draw_main_event( paper, main_line_events[eventId].change, line, image_width, image_height )

					key = main_line_events[eventId].change.from;
					if ( color_list[key] == null )
					{
						assignee_count += 1;
						color_list[key] = assignee_color(assignee_count);
					}

					line.color = color_list[key];
					//console.info("color ", line.color);
					line.start = line.end;
					line.end = 0;
				}
				if ( main_line_events[eventId].change.field == "status" )
				{
					line.end = get_left_pos( jira_date_parse( main_line_events[eventId].created ),
											createdDate, nowDate, image_width );

					// draw here
					draw_main_event( paper, main_line_events[eventId].change, line, image_width, image_height )

					if ( main_line_events[eventId].change.from == 3 )
					{
						line.weight = line_weight(true);
					}
					else if ( main_line_events[eventId].change.to == 3 )
					{
						line.weight = line_weight(false);
					}

					line.start = line.end;
					line.end = 0;
				}
			}
			// issue is not in progress when created
			line.weight = line_weight( false );
			draw_main_event( paper, main_line_events[0].change, line, image_width, image_height );
		}

    }

	function click_handler()
	{
		if ( jQuery('#issue-timeline').length == 0 ) 
		{
			// we need to construct new timeline
			jQuery("#jira").append(create_element("div", "timeline", "issue-timeline"));

			// close button
			var closeBtn = create_element("a", "close");
			closeBtn.addEventListener( "click", function() {
				jQuery('#issue-timeline').hide();
			})
			closeBtn.innerHTML = "Close";
			closeBtn.setAttribute("href", "#");
			closeBtn.setAttribute("title", "Close timeline");

			// caption
			var capt = create_element("h2");
			capt.innerHTML = "Issue timeline";

			var content = create_element("div", "content", "timeline-content");
			var innerWidth = jQuery("#issue-timeline").width() - 20; 
			content.width = innerWidth;

			// inner body
			jQuery("#issue-timeline").append(closeBtn).append(capt).append(content);

			jQuery.getJSON( json_issue_addr() , draw_timeline);
		}
		jQuery('#issue-timeline').show();

		return false;
	}

	// returns a place we should insert button to
	function buttons_parent()
	{
		var list = document.evaluate( "//*[contains(@class, 'toolbar-split toolbar-split-right')]", document, 
									  null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
		if ( list.snapshotLength == 1 )
		{
			return list.snapshotItem(0);
		}
		else
			return null;
	}

	// place button on page load
	function place_button()
	{
		// we may don't have jQuery yet. so make it with pure JS DOM.
		var group = create_element("ul", "toolbar-group");
		var item = create_element("li", "toolbar-item");
		var button = create_element("a", "toolbar-trigger", "edit-issue");
		button.innerHTML = "Timeline";
		button.addEventListener( "click", click_handler );

		item.appendChild( button );
		group.appendChild( item );

		var place_to_paste = buttons_parent();
		place_to_paste.appendChild( group );
	}

	place_button();

	// jQuery and Raphael are already bundled with Jira scripts
	//console.info(jQuery);
	//console.info(Raphael);

	add_css(
		"#issue-timeline { position: fixed; width: 98%; background-color: #FFFFFF; \
						   top: 20px; left: 0px; z-index: 5000; margin: 0 1%; border: 1px solid #E0E0E0; } \
		 #issue-timeline #timeline-content { min-height: 50px; margin: 10px; } \
		 #issue-timeline h2 { margin: 10px; } \
		 #issue-timeline .close { position: absolute; top: 0; right: 0; padding: 2px 6px; }"
	);
})();
