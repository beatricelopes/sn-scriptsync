function(scope){
		var c = scope.c;
		function openedInIframe () {
		if (window.parent && window.parent.location.pathname == '/gtb.do')
				return false;
		try {
			if(window.opener && window.opener.document.getElementById("section_form_id") != null && c.data.sysparm_kb_search_table){
				$('.breadcrumbs-container').css("display","none");
				return true;
			}
			return false;
		} catch (e) {
			return false;
		}
	}
	
	if(openedInIframe()){
		$("header nav").css("display","none");
		$(".container").css("width","100%");	
	}
	if((window.self !== window.top) && (window.top.location.href.includes('now/nav') || window.top.location.href.includes('nav_to')
))
		$("header nav").css("display","none");
}