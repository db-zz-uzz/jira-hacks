// ==UserScript==
// @description to add something.
// @version 0.1
// @include http://jira.zoran.com/browse/*
// @grant none
// ==/UserScript==

(function() {

	function eval_xpath( string )
	{
		return document.evaluate( string, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
	}

	function remove_cte( cteList ) 
	{
		for ( var i=0; i < cteList.snapshotLength; i++ )
		{
			var cteItem = cteList.snapshotItem(i);
			cteItem.className = cteItem.className.replace( "inactive", "inactive-disabled" );
			cteItem.title = "";
		}      
	};

	function check_loaded()
	{
		var cteList = eval_xpath("//*[contains(@class, 'editable-field inactive')]");
		if ( cteList.snapshotLength == 0 )
		{
			unsafeWindow.setTimeout( check_loaded, 500 );
		}
		else
		{
			remove_cte( cteList );
		}
	}
	
	function handle_click() 
	{
		var comment = this.parentNode.parentNode.parentNode;
		var form = document.getElementById("issue-comment-add");
		
		if ( form == null ||
		     comment.id != form.parentNode.id )
		{
			// no form in this comment. move it here.
			if ( form == null )
			{
				// no form found. force jira to show it.
				var clickTarget = document.getElementById("comment-issue");
				var clickEvent  = document.createEvent('MouseEvents');
				clickEvent.initEvent ('click', true, true);
				clickTarget.dispatchEvent (clickEvent);
			
				form = document.getElementById("issue-comment-add");
			}
			comment.appendChild( form.parentNode.removeChild( form ) );
			form.style.display = "block";
			document.getElementById("comment").focus();
		}
		else
		{
			// form already shown. move it to original position.
			var commentDiv = document.getElementById("addcomment");
			console.info( commentDiv.id );
			console.info( commentDiv.firstChild.id );
			commentDiv.appendChild( form.parentNode.removeChild( form ) );
		}
		
		return false;
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
	function main()
	{
		var linksList = eval_xpath( "id('issue_actions_container')/div/div/div[contains(@class, 'action-links')]" );
			
		for ( var i = 0; i < linksList.snapshotLength; i++ )
		{
			var commentLink = document.createElement("a");
			commentLink.setAttribute("href", "#");
			commentLink.setAttribute("title", "Add comment");
			commentLink.setAttribute("name", "quick-answer");
			commentLink.innerHTML = "Comment";
			
			commentLink.onclick = handle_click;
			
			linksList.snapshotItem(i).appendChild( commentLink );
		}
		
		add_css("header#stalker{ position: relative !important; left: 0px !important; } \
				#summary-val { font-size: 12pt !important; } \
				.stalker-placeholder { display: none !important; } \
				.issue-links tr .actions .icon, .issue-data-block .actionContainer .action-links { visibility: visible !important; } ");

		check_loaded();
	}
	
	main();
})();
