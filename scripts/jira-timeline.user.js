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

	function click_handler()
	{
		console.info("Timeline click handler");
		return false;
	}

	// returns a place we should insert button to
	function buttons_parent()
	{
		var list = document.evaluate( "//*[contains(@class, 'toolbar-split toolbar-split-right')]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
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
	console.info(jQuery);
	console.info(Raphael);
})();