function($scope,$rootScope,$compile,$timeout,KnowledgeSearchService,$filter) {
	/* widget controller */
	var c = this;
	c.data = c.data;
	c.showRange = c.options.min_scroll_count;
	c.options.title = c.options.title || "${Filter}";
	c.options.instanceid = c.data.instanceid;
	c.visible = false;
	c.clear = false;
	c.kind = "variable";
	c.type = "single_select";
	c.name = "tags";
	c.showQuery = false;
	c.enableSearch = false;
	c.gotoserver = true;
	c.selected = "";
	c.disableFilter = false;
	c.filteredItems = [];
	c.items = [];

	if($rootScope.isMobile){
		c.collapse = true;
	}else{
		c.collapse = false;
	}
	var input = {};
	input.name = c.name;
	input.element = "facet";
	input.kind = c.kind;
	input.type = c.type;
	input.table = 'label_entry';
	input.orderby = '';
	input.aggregate_query = c.options.aggregate_query;
	input.alt_url_params = c.options.alt_url_params;

	//Subscribe itself to search service on load
	KnowledgeSearchService.subscribe(input);

	var kbTagRefreshFacet = $rootScope.$on('sp.kb.refresh.facet',function(event,data){
		if(data && data[c.name] && data[c.name].length > 0){
			//do not update the data if the event is generated by same facet
			if(KnowledgeSearchService.canUpdateFacet(c.name,c.items,data[c.name])){
				c.items = data[c.name];
				c.query = "";
			}else{
				c.items = KnowledgeSearchService.setSelections(c.items,data[c.name]);
			}
			c.visible = true;
		}else{

			//hide facet if no data
			c.visible = false;
			c.items = [];
			c.selection = "";
			c.query = "";
		}

		if(data && c.data.facet_depth < data.meta.article_count){
			c.showQuery = true;
			c.gotoserver = true;
		}else{
			c.gotoserver = false;
		}
	});

	$scope.$watch("c.query",_.debounce(function(event){
		if(c.enableSearch && c.gotoserver){
			c.getMoreData();
		}else if(c.enableSearch){
			c.notifyResultUser(c.filteredItems);
		}
	},500));

	//Get more results for facet
	c.getMoreData = function(){
		c.disableFilter = true;
		var input = KnowledgeSearchService.getAppliedFilters();
		input.name = c.name;
		input.value = c.query;
		c.server.get(input).then(function(r) {
			if(r.data && r.data.result && r.data.result[c.name]){
				c.items = r.data.result[c.name];
				c.showQuery= true;
				c.gotoserver = true;

				if(c.query == "" && (c.data.facet_depth - 10) > c.items.length){
					c.gotoserver = false;
					c.disableFilter = false;
				}
				c.notifyResultUser(c.items);
			}
		});
	};

	c.notifyResultUser = function(resultLength){
		if(resultLength.length == 0)
			c.notity_noresults = "No results found for your search. Clear text to get all results";
		else
			c.notity_noresults = resultLength.length+ " " + "results found for your search.";
		$timeout(function(){
			$scope.$apply();
		});
	};

	var kbTagRefreshFacetSelection = $rootScope.$on("sp.kb.refresh.facet.selection",function(event,data){
		if(data && data[c.name] && data[c.name] == 'selected'){
			c.clear = true;
		}else{
			c.clear = false;
		}
	});

	//Watch clear link to clear all selections 
	$scope.$watch('c.clear',function(val){
		if(!val){
			c.items.forEach(function(item){
				item.selected = false; 
			});
		}
	});

	c.rowClick = function(item){
		c.items.forEach(function(item1){
			item1.selected = false; 
		});
		item.selected = true;
		c.updateKbFilterData(item);
	}

	//throw event for change in selection
	c.updateKbFilterData =function(item){
		item.selected = true;
		var data = {};
		data.name = c.name;
		data.type = c.type;
		data.label = item.label;
		data.id = item.id;
		$rootScope.$emit('sp.kb.updated.facet',data);
	};

	c.clearSelections = function(event){
		event.stopPropagation();
		c.clear = false;
		$rootScope.$emit("sp.kb.updated.facet.selection",{"name":c.name});
		/*Only keyboard navigation*/
		if(event.key)
			$('#f_header_'+c.data.instanceid).focus();
	};
	
	c.getFilteredMobileItems = function() {
		var filtered = $filter('filter') (c.items, {'label' : c.query});
		c.filteredItems = $filter('orderBy') (filtered, c.orderby);
		return c.filteredItems;
	}
	
	c.getFilteredItems = function() {
		var filtered = $filter('filter') (c.items, (!c.disableFilter || '') && {'label':c.query})
		c.filteredItems = $filter('orderBy') (filtered, 'label');
		return c.filteredItems;
	}

	$scope.$on('$destroy',function(){
		kbTagRefreshFacetSelection();
		kbTagRefreshFacet();
	});
}