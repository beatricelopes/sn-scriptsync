function($scope,$rootScope,$compile,$timeout,KnowledgeSearchService) {
	/* widget controller */
	var c = this;
	c.data = c.data;
	c.options.title = c.options.title || "${Filter}";
	c.options.instanceid = c.data.instanceid;
	c.error_text = "${Missing/Invalid Facet Options}";
	c.valid_facet_option = isValidJSON(c.options.facet_options);
	c.valid_facet =  c.options.template &&  c.options.facet_id && c.valid_facet_option ? true : false;

	if(c.options.template &&  c.options.facet_id && !c.valid_facet_option)
		c.error_text = "${Invalid Facet Option JSON}";

	c.collapse = false;
	c.clear = false;

	c.visible = false;
	if(!c.valid_facet && c.data.is_admin)
		c.visible = true;


	if($rootScope.isMobile){
		c.collapse = true;
	}else{
		c.collapse = false;
	}

	c.kind = "query";
	c.name = c.options.facet_id;
	c.items = [];

	if(c.name && c.valid_facet){
		var input = {};
		input.name = c.name;
		input.element = "facet";
		input.kind = c.kind;
		input.type = c.options.facet_type;
		input.filters = c.options.facet_options ? JSON.parse(c.options.facet_options) : "";
		input.dynamic = c.options.dynamic;
		input.alt_url_params = c.options.alt_url_params;

		//Subscribe itself to service on load
		KnowledgeSearchService.subscribe(input);

		var kbQueryRefreshFacet = $rootScope.$on('sp.kb.refresh.facet',function(event,data){
			if(data && data[c.name] && data[c.name] != "invalid_input" && data[c.name].length > 0){
				//do not update the data if the event is generated by same facet
				if(KnowledgeSearchService.canUpdateFacet(c.name,c.items,data[c.name])){
					c.items = data[c.name];
					c.items.forEach(function(item) {
						if($scope.lastSelected == item.id) {
							$timeout(function(){
								if($('#' + item.id).is(":visible")){
									$('#' + item.id).focus();
								}
								else{
									$('#' + item.id+'sm').focus();
								}
								$scope.lastSelected = "";
							});
						}
					})
					c.query = "";
				}else{
					c.items = KnowledgeSearchService.setSelections(c.items,data[c.name]);
				}
				if((data.meta && data.meta.article_count > 0) || c.hasSelections(data[c.name])){
					c.visible = true;
				}else{
					c.visible = false;
				}
			}else{

				//hide facet if no or invalid data 
				if(data[c.name] == "invalid_input"){
					c.valid_facet = false;
					c.visible = true;
				}else{
					c.visible = false;
				}
				c.items = [];
				c.selection = "";
				c.query = "";
			}
		});
	}

	//Validate selection
	c.hasSelections = function(item){
		var ans = false;
		for(var i=0;i<item.length;i++){
			if(item[i].selected){
				ans = true;
				break;
			}
		}
		return ans;
	};

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
		$scope.lastSelected = item.id;
		c.updateKbFilterData(item);
	}

	//throw event for change in selection
	c.updateKbFilterData =function(item){
		item.selected = true;
		var data = {};
		data.name = c.name;
		data.type = c.options.facet_type;
		data.label = item.label;
		data.id = item.id;
		data.query = item.query;
		$rootScope.$emit('sp.kb.updated.facet',data);
	};

	var kbQueryRefreshFacetSelection =	$rootScope.$on("sp.kb.refresh.facet.selection",function(event,data){
		if(data && data[c.name] && data[c.name] == 'selected'){
			c.clear = true;
		}else{
			c.clear = false;
		}
	});

	c.clearSelections = function(event){
		event.stopPropagation();
		c.clear = false;
		$rootScope.$emit("sp.kb.updated.facet.selection",{"name":c.name});
		/*Only keyboard navigation*/
		if(event.key)
			$('#f_header_'+c.data.instanceid).focus();
	};

	function isValidJSON(str){
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}

	$scope.$on('$destroy',function(){
		kbQueryRefreshFacet();
		kbQueryRefreshFacetSelection();
	});
}