// ==UserScript==
// @name        jira-issue-timeline
// @description Draw timeline for issue.
// @include     http://jira.zoran.com/browse/*
// @version     0.1
// @grant 		none
// ==/UserScript==

(function () {

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

    function jira_date_to_msec( date_str )
    {
    	console.info( date_str );

    	var t_pos = date_str.indexOf("T");
    	var msec_pos = date_str.indexOf(".");
    	// do not take GMT offset into account for now

    	var date_val = date_str.substring(0, t_pos).split("-");
    	var time_val = date_str.substring(t_pos+1, msec_pos).split(":");
    	var msec_val = date_str.substring(msec_pos + 1, msec_pos+4);

    	var datetime = new Date( date_val[0], date_val[1], date_val[2],
    							time_val[0], time_val[1], time_val[2], 
    							msec_val );

    	console.info(datetime.toString());
    	return datetime.getTime();
    }

    function json_issue_addr()
    {
    	return "http://jira.zoran.com/rest/api/latest/issue/" + document.getElementById("key-val").innerHTML;
    }

    function draw_timeline( data )
    {
    	var image_width = jQuery("#timeline-content").width();
		var paper = new Raphael( document.getElementById("timeline-content"), image_width, 200 );


		var mainLine = paper.path("M 10 100 l "+(image_width-20)+" 0");

		var issue = data.fields;

		console.info( jira_date_to_msec(issue.created) );
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
		 #issue-timeline #timeline-content { min-height: 50px; margin: 10px; background-color: #DDDDDD; } \
		 #issue-timeline h2 { margin: 10px; } \
		 #issue-timeline .close { position: absolute; top: 0; right: 0; padding: 2px 6px; }"
	);
})();