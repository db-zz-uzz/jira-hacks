// ==UserScript==
// @description to add something.
// @version 0.1
// @include http://jira.zoran.com/browse/*
// @grant none
// ==/UserScript==

(function() {

    function form_cancel_button()
    {
        return document.getElementById("issue-comment-add-cancel");
    }

    function comment_form()
    {
        return document.getElementById("issue-comment-add");
    }

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

    function check_page_loaded()
    {
        var cteList = eval_xpath("//*[contains(@class, 'editable-field inactive')]");
        if ( cteList.snapshotLength == 0 )
        {
            unsafeWindow.setTimeout( check_page_loaded, 500 );
        }
        else
        {
            remove_cte( cteList );
        }
    }
    
    function move_form_back()
    {
        var commentDiv = eval_xpath("id('addcomment')/div[contains(@class, 'mod-content')]");
        var form = comment_form();
        if ( commentDiv.snapshotLength == 1)
        {
            commentDiv.snapshotItem(0).appendChild( form.parentNode.removeChild( form ) );
        }
    }

    function handle_click() 
    {
        var comment = this.parentNode.parentNode.parentNode;
        var form = comment_form();
        
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
            
                form = comment_form();
            }
            comment.appendChild( form.parentNode.removeChild( form ) );
            document.getElementById("comment").focus();
        }
        else
        {
            // form already shown. move it to original position.
            move_form_back();
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
    
    function make_dummy_node()
    {
        var node = document.createElement("span");
        node.setAttribute("style", "display=none;");
        node.id = "cte-dummy-node";

        return node;
    }

    function check_content_loaded()
    {
        if ( document.getElementById("cte-dummy-node") == null )
        {
            // no dummy found. re-install buttons.
            install_comments_buttons();
        }
        else
        {
            // dummy is still there. wait a bit more.
            unsafeWindow.setTimeout( check_content_loaded, 100 );
        }
    }

    function set_tab_click_handler()
    {
        var tabsList = eval_xpath( "id('issue-tabs')/li/a" );

        for ( var i = 0; i < tabsList.snapshotLength; i++ )
        {
            tabsList.snapshotItem(i).addEventListener( "click", function() {
                    move_form_back();
                    unsafeWindow.setTimeout( check_content_loaded, 100 );
                } );
        }
    }

    function install_comments_buttons()
    {
        var commentLinkList = eval_xpath( "id('issue_actions_container')/div/div/div[contains(@class, 'action-links')]" );
            
        for ( var i = 0; i < commentLinkList.snapshotLength; i++ )
        {
            var commentLink = document.createElement("a");
            commentLink.setAttribute("href", "#");
            commentLink.setAttribute("title", "Add comment");
            commentLink.setAttribute("name", "quick-answer");
            commentLink.innerHTML = "Comment";
            
            commentLink.onclick = handle_click;
            
            commentLinkList.snapshotItem(i).appendChild( commentLink );
        }

        dummy_node = document.getElementById("issue_actions_container").parentNode.appendChild( make_dummy_node() );

        set_tab_click_handler();
    }

    function main()
    {
        // at page open content already in place.
        install_comments_buttons();        
        
        add_css("header#stalker{ position: relative !important; left: 0px !important; } \
                #summary-val { font-size: 12pt !important; } \
                .stalker-placeholder { display: none !important; } \
                .issue-links tr .actions .icon, .issue-data-block .actionContainer .action-links { visibility: visible !important; } ");

        check_page_loaded();
    }
    
    main();
})();
