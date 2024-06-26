function($scope,$rootScope,$compile,$timeout,KnowledgeSearchService,$filter) {
	/* widget controller */
	var c = this;
	c.data = c.data;
	c.options.title = c.options.title || "${Filter}";
	c.options.instanceid = c.data.instanceid;
	c.visible = false;
	c.collapse = false;
	c.clear = false;
	c.kind = "query";
	c.type = "single_select";
	c.name = "resources";
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
	input.table = "all";
	input.orderby = '';
	input.dynamic = c.options.dynamic;
	input.alt_url_params = c.options.alt_url_params;

	//Subscribe itself to search service on load
	KnowledgeSearchService.subscribe(input);

	var kbResourseRefreshFacet = $rootScope.$on('sp.kb.refresh.facet',function(event,data){
		if(data && data[c.name] && data[c.name].length > 0){
			//do not update the data if the event is generated by same facet
			if(KnowledgeSearchService.canUpdateFacet(c.name,c.items,data[c.name])){
				c.items = data[c.name];
			}else{
				c.items = c.setSelections(c.items,data[c.name]);
			}
			
			c.items.forEach(function(item){
				if(c.data.messages.hasOwnProperty(item.id))
					{
						item.label = c.data.messages[item.id];
					}							
			});

			if(!(c.items.length == 1 && c.items[0].id == "Knowledge" && !c.items[0].selected))
				c.visible = true;
			else
				c.visible = false;
		}else{

			//hide facet if no data
			c.visible = false;
			c.items = [];
			c.selection = "";
			c.query = "";
		}
	});

	var kbResourseRefreshFacetSelection =  $rootScope.$on("sp.kb.refresh.facet.selection",function(event,data){
		if(data && data[c.name] && data[c.name] == 'selected'){
			c.clear = true;
		}else{
			c.clear = false;
		}
	});

	c.rowClick = function(item){
		c.items.forEach(function(item1){
			item1.selected = false; 
		});
		item.selected = true;
		c.updateKbFilterData(item);
	}
	////throw event for change in selection
	c.updateKbFilterData =function(item){
		item.selected = true;
		var data = {};
		data.name = c.name;
		data.type = c.type;
		data.label = item.label;
		data.id = item.query;
		data.query = item.query;
		$rootScope.$emit('sp.kb.updated.facet',data);
	};

	//Watch clear link to clear all selections 
	$scope.$watch('c.clear',function(val){
		if(!val){
			c.items.forEach(function(item){
				item.selected = false; 
			});
		}
	});

	//Used to update previous selection on change 
	c.setSelections = function(items,dataSet){
		for(var i = 0;i<items.length;i++){
			items[i].selected = false;
			for(var j = 0;j<dataSet.length;j++){
				if(items[i].query == dataSet[j].query && dataSet[j].selected){
					items[i].selected = true;
				}
			}
		}

		return items;
	};

	c.clearSelections = function(event){
		event.stopPropagation();
		c.clear = false;
		$rootScope.$emit("sp.kb.updated.facet.selection",{"name":c.name});
		/*Only keyboard navigation*/
		if(event.key)
			$('#f_header_'+c.data.instanceid).focus();
	};
	
	c.filterById = function(id) {
		return $filter('filter') (c.items, {'id': id});
	}
	
	c.getOrderedItems = function(id) {
		return $filter('orderBy') (c.filterById('Answer'), 'label');
	}
	
	$scope.$on('$destroy',function(){
		kbResourseRefreshFacet();
		kbResourseRefreshFacetSelection();
	});
}