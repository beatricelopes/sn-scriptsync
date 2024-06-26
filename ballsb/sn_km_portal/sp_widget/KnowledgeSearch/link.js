function(scope,element,attr){
	if(scope.data.set_foccus)
	setTimeout(function(){
		element.find('#kb_search_input').focus();
	},0);
	
	var c = scope.c;
	$rootScope = $injector.get("$rootScope");
	$window	= $injector.get("$window");
	
	c.showFiltersButton = true;
	
	c.showAndHideFilters = function(){
		if(c.showFiltersButton==true){
			$(".hide-filters").addClass("show-filters").removeClass("hide-filters");
			$(".expand-width").addClass("original-width").removeClass("expand-width");
			c.showFiltersButton = false;
		}else{
			$(".show-filters").addClass("hide-filters").removeClass("show-filters");
			$(".original-width").addClass("expand-width").removeClass("original-width");
			c.showFiltersButton = true;
		}
	}
	
	c.hideFilters = function(){
	  $(".show-filters").addClass("hide-filters").removeClass("show-filters");
		$(".original-width").addClass("expand-width").removeClass("original-width");
		c.showFiltersButton = true;
	}
	
	c.toggleFacets = function(){
		$rootScope.showFacet = !$rootScope.showFacet;
		if($rootScope.showFacet)
			setTimeout(function() { $('button.kb-fixed-facet-done').focus();},0);
		$rootScope.showLanguageFacet = false;
	}
	
	c.showLanguageFacet = function(){
		$rootScope.showFacet = !$rootScope.showFacet;
		$rootScope.showLanguageFacet = true;
		if($rootScope.showLanguageFacet)
			setTimeout(function() { $('button.kb-fixed-facet-done').focus();},0);
	}
	
	c.keywordChanged = function(event){
		c.keyword = c.keyword.trim();

		if(c.keyword != c.oldKeyword){
			//handle keyboard events for enter and keyup
			if(event){
				var keycode = (event.keyCode ? event.keyCode : event.which);
				if(!c.data.allow_instant_search && keycode != 13)
					return;
			}

			//throw update event based on options			
			if( (c.data.allow_empty_search && c.keyword == "") || (c.keyword && c.keyword.length >= c.data.min_search_char)){
				setWindowTitle(c.keyword);
				$rootScope.$emit('sp.kb.updated.keyword',{'keyword':c.keyword});
				c.hideFilters();
			}

			c.oldKeyword = angular.copy(c.keyword);
		}
	};

	//If instant search enable then wait for 200ms for the next input then throw event
	$("#kb_search_input").keyup(_.debounce(function(event){
		c.keywordChanged(event);
	},c.options.search_wait));

	$(window).resize(function() {
		var width1 = $(window).width();
		if(width1<=992 && !$rootScope.isMobile){
			$rootScope.isMobile = true;
		}else if(width1>992 && $rootScope.isMobile ){
			$rootScope.showFacet = false;
			$rootScope.isMobile = false;
		}
	});
	
	//set keyword onload from url and throw event
	if(c.data.keyword){
		setWindowTitle(c.data.keyword);	
		c.keyword = c.data.keyword;
		c.keywordChanged();
	}
	
	 function setWindowTitle(title){
		$window.document.title = title+ ' ' + scope.page.static_title + (!scope.portal.hide_portal_name ? ' - ' + scope.portal.title : '');
	}
}