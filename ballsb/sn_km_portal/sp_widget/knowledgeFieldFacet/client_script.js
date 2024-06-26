function($scope,$rootScope,$compile,$timeout,KnowledgeSearchService) {
	/* widget controller */
	var c = this;
	c.data = c.data;
	c.showRange = c.options.min_scroll_count;
	c.options.title = c.options.title || "${Filter}";
	c.error_text = "${Missing/Invalid Facet Options}";
	c.valid_field = c.data.valid_field;
	c.kind = "variable";
	c.name = c.options.field_name;
	c.isAggregateQuery = c.options.aggregate_query;
	c.showQuery = false;
	c.enableSearch = false;
	c.gotoserver = true;
	c.selected = "";
	c.disableFilter = false;
	c.filteredItems = [];
	c.treeData = false;
	c.cachedCategoryTreeData = "";
	c.noChild = true;
	if(c.name=="kb_category" && c.data.category_as_tree){
		c.treeData = true;
	}

	//seting order to label if no other field is provided
	c.orderby = c.options.order_by && c.options.order_by != "label" ? "order" : "label";
	c.items = [];

	if(c.options.field_name && c.options.table && !c.valid_field && c.data.template)
		c.error_text = "${Field Type Not Supported}";

	c.options.instanceid = c.data.instanceid;

	c.visible = false;
	if(!c.valid_field && c.data.is_admin)
		c.visible = true;

	c.collapse = false;
	c.clear = false;
	if($rootScope.isMobile){
		c.collapse = true;
	}else{
		c.collapse = false;
	}
	
	$scope.displayChildren = function($event, category) {
		$event.stopPropagation();
		category.show_children = !category.show_children;
	};
	
	if(c.name && c.options.table && c.valid_field && c.data.template){
		var input = {};
		input.name = c.name;
		input.title = c.options.title;
		input.element = "facet";
		input.table = c.options.table;
		input.kind = c.kind;
		input.type = c.options.facet_type;
		input.orderby = c.options.order_by || '';
		input.aggregate_query = c.isAggregateQuery;
		input.alt_url_params = c.options.alt_url_params;
		input.show_empty_value = c.options.show_empty_value || false;
		input.treeData = c.treeData;
		
		//Subscribe itself to search service on load
		KnowledgeSearchService.subscribe(input);

		var refreshKbFacet = $rootScope.$on('sp.kb.refresh.facet',function(event,data){
			if(data && data[c.name] && data[c.name].length > 0){
				//do not update the data if the event is generated by same facet
		
				var newdata = data[c.name];
				var isCurrentFacetFiltered = data.meta.categoryFiltered;
				if(c.name == "kb_category" && c.treeData){
					newdata = data.meta.categoryTree;
				}
				if(c.name == "kb_category" && c.treeData){
					 c.cachedCategoryTreeData = data.meta.categoryTree;
				}else{
					 c.cachedCategoryTreeData = "";
				}
				if(!c.clear || KnowledgeSearchService.canUpdateFacet(c.name,c.items,newdata,isCurrentFacetFiltered)){
					c.selection = "";
					c.query = "";
					if(c.name == "kb_category" && c.treeData){
						c.verifyNoChilds(data.meta.categoryTree);	
						c.items = data.meta.categoryTree;
					}else{
						c.items = data[c.name];
					}
				}else{
					if(!(c.name == "kb_category" && c.treeData))
					  c.items = KnowledgeSearchService.setSelections(c.items,newdata);
				}

				if(c.options.template == 'kb_facet_dropdown_select'){
					//handle data population and auto selection
					$timeout(function(){
						angular.element("#select_filter_"+c.options.instanceid).val(c.isSelected(c.items)).trigger("change");
					},0);
				}
				c.visible = true;
			}else{

				//hide facet if no data
				c.cachedCategoryTreeData = "";
				c.visible = false;
				c.items = [];
				c.selection = "";
				c.query = "";
			}

			if(!c.isAggregateQuery || (c.data.facet_depth - 10) < c.items.length){
				c.showQuery = true;
				c.gotoserver = true;
			}else{
				c.gotoserver = false;
			}
		});

		$scope.$watch("c.query",_.debounce(function(event){
			if(c.enableSearch && c.gotoserver)
				c.getMoreData();
			else if(c.enableSearch){
				c.notifyResultUser(c.filteredItems);
			}
		},500));

	}

  c.verifyNoChilds = function(items){
		c.noChild = true;
		for(i=0;i<items.length;i++){
			var item = items[i];
			if(item.childs && item.childs.length > 0){
				c.noChild =false;
				break;
			}
		}
	}
	//Get more results for facet
	c.getMoreData = function(){
		var input = KnowledgeSearchService.getAppliedFilters();
		input.name = c.name;
		input.value = c.query;
		if(c.name == "kb_category" && c.treeData && input.variables.kb_category){
				input.variables.kb_category.treeData = false;
		}
		c.server.get(input).then(function(r) {
			c.disableFilter = true;
			if(r.data && r.data.result && r.data.result[c.name]){
				c.verifyNoChilds(r.data.result[c.name]);	
				c.items = r.data.result[c.name];
				c.showQuery= true;
				c.gotoserver = true;

				if(c.query == "" && (c.data.facet_depth - 10) > c.items.length){
					c.gotoserver = false;
					c.disableFilter = false;
				}
				if(c.query == "" && c.name == "kb_category" && c.treeData){
					c.gotoserver = true;
					if(c.cachedCategoryTreeData != ""){
						c.verifyNoChilds(c.cachedCategoryTreeData);	
						c.items = c.cachedCategoryTreeData;
					}else{
						c.verifyNoChilds(r.data.result.meta.categoryTree);
						c.items = r.data.result.meta.categoryTree;
					}
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

	c.filterItems = function(item){
		return item.label 
	};

	//Watch clear link to clear all selections 
	$scope.$watch('c.clear',function(val){
		if(!val){
			c.items.forEach(function(item){
				item.selected = false; 
			});
		}
	});

	c.rowClickCheckbox = function(item){
		var targetEle = event.target;
		if(item){
			var checkboxObjArray = $(targetEle).find('input:checkbox');
			if($(targetEle).attr("class").split(" ")[0]=='checkbox-label'){
					checkboxObjArray = $(targetEle.parentElement).find('input:checkbox');
			}
			if(checkboxObjArray.length>0){
				var checkboxEle = checkboxObjArray[0];
				if(checkboxEle.checked){
					item.selected = false;
					$(checkboxEle).attr("checked", false);
				}else{
					item.selected = true;
					$(checkboxEle).attr("checked", true);
				}
				c.updateKbFilterData(item);
			}
		}
	}
	c.rowClick = function(item){
		if(item.hasOwnProperty("show_children"))
			 item.show_children = !item.show_children;
		c.items.forEach(function(item1){
			item1.selected = false; 
		});
		if(c.name=="kb_category" && c.treeData){
			c.removeSelections(c.items);
		}
		item.selected = true;
		c.updateKbFilterData(item);
	}
	c.removeSelections = function(results){
		results.forEach(function(item){
			item.selected = false;
			if(item.hasOwnProperty("childs"))
				c.removeSelections(item.childs);
		});
	}
	c.updateKbFilterData =function(item){
		if(item){
			var data = {};
			data.name = c.name;
			data.type = c.options.facet_type;
			data.label = (c.options.facet_type == 'dropdown_select') ? c.getLabel(item) : item.id == 'NULL_VALUE' ? c.options.title+" "+item.label : item.label;
			data.id = (c.options.facet_type == 'dropdown_select') ? item : item.id;
			if(c.name == "kb_category" && c.treeData && c.query==""){
				data.categoryFiltered = true;
			}
			
			if(c.options.facet_type == 'multi_select')
				data.selected = item.selected;
			$rootScope.$emit('sp.kb.updated.facet',data);
		}
	};

	var refreshKbFacetSelection = $rootScope.$on("sp.kb.refresh.facet.selection",function(event,data){
		if(data && data[c.name] && data[c.name] == 'selected'){
			c.clear = true;
		}else{
			c.clear = false;
		}
	});

	//check if the item is selected in data
	c.isSelected = function(itemData){
		for(var i=0;i<itemData.length;i++){
			if(itemData[i].selected){
				return itemData[i].id.toString();
			}
		}
		return "";
	};

	//Get label for the item id
	c.getLabel = function(id){

		for(var i=0;i<c.items.length;i++){
			if(c.items[i].id == id){
				return c.items[i].label;
			}
		}
		return '';
	};

	c.clearSelections = function(event){
		event.stopPropagation();
		c.clear = false;
		$rootScope.$emit("sp.kb.updated.facet.selection",{"name":c.name});
		/*Only keyboard navigation*/
		if(event.key)
			$('#f_header_'+c.data.instanceid).focus();
	};
	
	$scope.$on('$destroy',function(){
		refreshKbFacet();
		refreshKbFacetSelection();
	});
}