function($rootScope,$window,$timeout,KnowledgeSearchService,$scope) {
	var c = this;


	
	c.keyword = c.data.keyword || "";
	c.oldKeyword = c.data.keyword || "";
	c.options.glyph = c.options.glyph || 'search';
	c.filterCount =0;
	c.applycolor =false;
	c.items =[];
	c.showLanguageIcon = false;
	if($rootScope.showLanguageIcon){
		c.showLanguageIcon = $rootScope.showLanguageIcon;
	}
	var qry;

	//Subscribe search element to service on load
	if(KnowledgeSearchService){
		var input = {};
		input.element = "search";
		input.alt_url_params = c.options.alt_search_url_params;
		KnowledgeSearchService.subscribe(input);
	}
	var refreshSearchFilter = $rootScope.$on('sp.kb.refresh.filter',function (event,data){
		if(data){
			c.items = data;
		}
		if(c.items.length>0){
			c.filterCount = c.items.length;
			c.applycolor = true;
		}else{
			c.filterCount = 0;
			c.applycolor = false;
		}
	});


	var refreshKeyword = $rootScope.$on('sp.kb.refresh.keyword',function(event,data){
		if(data)
			c.keyword = data.keyword;				 
	});
	
	$scope.$on('$destroy',function(){
		refreshSearchFilter();
		refreshKeyword();
	});

    // watch on showLanguageIcon variable in rootScope
	var watcher = $rootScope.$watch('showLanguageIcon', function(){
		c.showLanguageIcon = $rootScope.showLanguageIcon;
		// stop watching
		watcher();
	});
	
}