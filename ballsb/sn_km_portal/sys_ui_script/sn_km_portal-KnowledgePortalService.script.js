angular.module("sn.app_knowledge",[])
	.service("KnowledgeSearchService", ['$rootScope', '$http','$timeout','$location', function($rootScope,$http,$timeout,$location){

		var kbData = {};
		var f = {};
		f.keyword = "";
		f.language = "";
		f.languageFilters = [];
		f.order = "sys_view_count";
		f.order_desc = true;
		f.pageID = "";
		f.paginationMinResCount = 0;
		f.article_count = "";
		f.cachedFacetData = null;
		f.hasURLParams = false;
		f.faceTypeMap = {};
		f.savedLanguagePreferranceValue ="";

		f.variableParams = {};
		f.queryParams = {};
		f.resource = "";

		f.urlActualParams = {};
		f.urlAltParams = {};
		f.urlParameterValues = {};

		f.breadcrumbFilters = [];
		f.facetData = {};
		f.requiredFacets = [];
		f.initData = null;

		f.selectionStack = [];
		$rootScope.facetSubscribed = false;

		var width = $(window).width();
		if(width<=991){
			$rootScope.isMobile = true;
		}else if(width>991){
			$rootScope.isMobile = false;
		}
		$rootScope.showFacet = false;
		$rootScope.showLanguageFacet = false;

		//init search & lannguage param incase not subscribe;
		f.urlActualParams.query = "query";
		f.urlActualParams.language = "language";
		var timeout, hasLanguageParam = false;
		angular.forEach($location.search(), function(value, key) {
			if(key != "id" && key != "spa" && key != "sysparm_kb_search_table" && key != "query"){
				f.requiredFacets.push(key);
				if(key == "language")
					hasLanguageParam = true;
			}
		});
		
		if(!hasLanguageParam)
			f.requiredFacets.push("language");
		
		//subscribe the available facets and initiate the respective objects based on type
		kbData.subscribe = function(data){
			if(data && data.element){
				if(data.element == 'facet'){
					if(data.kind){
						if(data.kind == 'query'){
							f.queryParams[data.name] = {};
							f.queryParams[data.name].filters = data.filters || "";
							f.queryParams[data.name].value = "";
							f.queryParams[data.name].dynamic = data.dynamic || false;
							f.queryParams[data.name].treeData = data.treeData || false;
							f.faceTypeMap[data.name] = data.type;

							f.urlActualParams[data.name] = data.name;
							if(data.alt_url_params){
								var qParams =  data.alt_url_params.toString().split(",");
								qParams.forEach(function(key){
									f.urlAltParams[key] = data.name;
								});
							}
						}else{
							f.variableParams[data.name] = {};
							f.variableParams[data.name].value = [];
							f.variableParams[data.name].orderby = data.orderby;
							f.variableParams[data.name].table = data.table;
							f.variableParams[data.name].include_null = data.show_empty_value || false;
							f.variableParams[data.name].aggregate = data.aggregate_query || false;
							f.variableParams[data.name].title = data.title || "";
							f.variableParams[data.name].treeData = data.treeData || false;
							f.faceTypeMap[data.name] = data.type;

							f.urlActualParams[data.name] = data.name;
							if(data.alt_url_params){
								var fParams =  data.alt_url_params.toString().split(",");
								fParams.forEach(function(key){
									f.urlAltParams[key] = data.name;
								});
							}
						}
						$rootScope.facetSubscribed = true;
					}
				}else if(data.element == 'search'){
					if(data.alt_url_params){
						var sParams =  data.alt_url_params.toString().split(",");
						sParams.forEach(function(key){
							f.urlAltParams[key] = "query";
						});
					}

				}else if(data.element == 'language'){
					if(data.alt_url_params){
						var lParams =  data.alt_url_params.toString().split(",");
						lParams.forEach(function(key){
							f.urlAltParams[key] = "language";
						});
					}
					f.faceTypeMap["language"] = data.type;
				}

				if(f.requiredFacets.length > 0){
					var index = f.requiredFacets.indexOf(data.name);
					if(index != -1){
						f.requiredFacets.splice(index,1);
					}
					if(index == -1 && data.alt_url_params){
						f.requiredFacets.forEach(function(key, i){
							if(f.urlAltParams.hasOwnProperty(key)){
								f.requiredFacets.splice(i,1);
							}
						});
					}
				}
				
			}
		};

		$rootScope.$watch("f.requiredFacets",function(){
			if(f.requiredFacets.length == 0 && f.initData && timeout){
				$timeout.cancel(timeout);
				f.initialize(f.initData);
			}	
		});

		// logic to handle the back button. listen for location change events and skip on filter selection
		f.monitorLocationChange = function(){
			f.unRegLocationChange = $rootScope.$on('$locationChangeSuccess', function(e) {
				var urlParams = $location.search();
				if( f.pageID && f.pageID != urlParams.id){
					e.preventDefault();
					return;
				}
				if($rootScope.refreshKBPage && $rootScope.facetSubscribed){
					f.getInitFilterData();
				}

				$rootScope.refreshKBPage = true;
			});
		};

		//Handles first load of facets based on subscription
		f.getInitFilterData = function(){
			if($rootScope.facetSubscribed){
				f.cachedFacetData = null;
				f.restAllSelections();
				f.initWithURLParams();
				f.initLangaugeWithSavedPreferranceValue();

				if(kbData.getKeyword()!=""){
					kbData.setOrder('relevancy');
					kbData.setOrderDesc(true);
				}
			}
			$rootScope.$emit('sp.kb.refresh.result',kbData.getResultQueryData());
			if(kbData.getKeyword()!=""){
				$rootScope.$emit('sp.kb.refresh.suggestion',{'keyword':kbData.getKeyword(), 'language':kbData.getLanguage()});
			}
			if($rootScope.facetSubscribed){
				$timeout(function(){
					kbData.fetchFilterData();
				},50);	
			}
				
			if(angular.element('#kb_search_input'))
				angular.element('#kb_search_input').focus();
		};

		f.initLangaugeWithSavedPreferranceValue = function(){

			if(kbData.getLanguage()==""){
				var savedLang = f.savedLanguagePreferranceValue; 
				if(savedLang){
					var varlang = savedLang.toString().split(",");
					varlang.forEach(function(v){
						f.languageFilters.push(v);
					});
					kbData.setLanguage();
				}
			}
		};
		//Get data for result widget
		kbData.getResultQueryData = function(){
			var data = {};
			data.keyword = kbData.getKeyword();
			data.language = kbData.getLanguage();
			data.variables =  kbData.getResultVariableParams();
			data.resource = kbData.getResource() || "";
			data.kb_query =  f.getEncodedQuery("kb_knowledge") || "";
			data.social_query =  f.getEncodedQuery("kb_social_qa_question") || "";
			data.category_as_tree =false;
			if(f.variableParams.kb_category){
				data.category_as_tree = f.variableParams.kb_category.treeData;
			}
			data.order = kbData.getOrder()+","+kbData.isOrderDesc();
			return data;
		};

		//Get all applied filters
		kbData.getAppliedFilters = function(categoryFiltered){
			var data = {};
			data.keyword = kbData.getKeyword();
			data.language = kbData.getLanguage();
			data.portal_suffix = $rootScope.portal ? $rootScope.portal.url_suffix : "kb";
			data.variables =  angular.copy(kbData.getVariableParams());
			data.query = kbData.getQueryParams();
			data.order =  kbData.getOrder()+','+kbData.isOrderDesc();
			data.paginationMinCount = kbData.getPaginationMinResCount();
			if(categoryFiltered && data.variables && data.variables.hasOwnProperty("kb_category")){
				data.variables.kb_category['categoryFiltered'] = true;
			}
			return data;
		};

		//Get all facetData
		kbData.fetchFilterData = function(categoryFiltered){
			var promise = f.excecuteFilterQuery(categoryFiltered);
			promise.then(f.reqSuccess,f.reqFailled);
		};

		f.excecuteFilterQuery = function(categoryFiltered){
			//Call to Rest API
			var request = $http.post("/api/now/v1/knowledge/search/facets", {
				params	: kbData.getAppliedFilters(categoryFiltered),
				timeout	: {}
			});

			return request;
		};

		f.reqSuccess = function(response){
			if(response.data){
				var result = response.data.result;
				if(f.cachedFacetData == null && f.breadcrumbFilters.length == 0 && !f.hasURLParams && result && result.meta && result.meta.article_count != 0){
					f.cachedFacetData = angular.copy(result);
				}
				f.processFacetData(result);
			}
		};

		f.reqFailled = function(response){
			console.log('Facet request failed');
		};

		f.processFacetData = function(data){
			kbData.setFacetData(data);

			if(data.meta){
				var count = 0;
				//Update the article count text
				if(data.meta.article_count)
					count =  parseInt(data.meta.article_count);
				f.article_count = count;

				var pageMinResultCount = 0;
				if(data.meta.results_count)
					pageMinResultCount = parseInt(data.meta.results_count);


				if(data.meta.has_more_results){
					if(count > 100)
						count = Math.floor(count / 10) * 10;
					f.article_count = count + "+";
				}

				if(f.hasURLParams){
					f.initBreadcrumbData(kbData.getFacetData());
				}else{
					//Broadcast update in article count for filter breadcrumb
					$rootScope.$emit('sp.kb.refresh.filter',kbData.getBreadcrumbFilters());
				}

				//update all facets with new data
				$rootScope.$emit('sp.kb.refresh.facet',kbData.getFacetData());
				//Broadcast update in article count for refine lable
				$rootScope.$emit('sp.kb.updated.article.count',{'count':f.article_count, 'pagMinResCount':pageMinResultCount,'selections':kbData.getBreadcrumbFilters().length});

			}
		};
		//Set initial parameters and request init load
		$rootScope.$on('sp.kb.update.initialize',function(event,data){
			f.initData = data;
			if(f.requiredFacets.length == 0) f.initialize(data);
			else{
				timeout = $timeout(function(){
					f.initialize(data);
				},200);
			}
		});
		
		f.initialize = function(data){
			if(!f.initData) return;
		
			f.initData = null;
			f.monitorLocationChange();//Initialize monitoring location change 
			if(data){
				kbData.setOrder(data.order);
				kbData.setOrderDesc(data.order_desc);
				if(data.minResultCount && parseInt(data.minResultCount)>0)
					kbData.setPaginationMinResCount(data.minResultCount);
				f.getInitFilterData();
				$rootScope.$emit('sp.kb.refresh.sortorder',{'order':kbData.getOrder(),'order_desc':kbData.isOrderDesc()});
			}	
		}
		//Event thrown by facet widget on change
		//Handle change based on type single/multiple
		//update breadcrumb, result and other facet widgets
		$rootScope.$on('sp.kb.updated.facet',function(event,data){
			var publish = false;
			if(data){
				var dataIndex = f.getBreadcrumbIndex(data);
				//if type multi then add/remove from breadcrumb
				if(data.type == 'multi_select'){
					if(dataIndex < 0 && data.id && data.name && data.selected){
						//update variable selecton stack
						f.selectionStack.push(data.name);
						f.variableParams[data.name].value.push(data.id);

						f.breadcrumbFilters.push(data);
						publish = true;

					}else if(!data.selected){
						//remove last variable from selecton
						if(data.name == f.selectionStack[f.selectionStack.length-1])
							f.selectionStack.pop();
						var queryIndex = f.vContains(f.variableParams[data.name].value,data.id);
						if(queryIndex > -1)
							f.variableParams[data.name].value.splice(queryIndex,1);
						f.breadcrumbFilters.splice(dataIndex,1);
						publish = true;
					}

				}else{
					//Else if type is single do nothing if already exist in breadcrumb
					if(dataIndex == -1){
						//update variable selecton stack
						f.selectionStack.push(data.name);
						var nameIndex = f.getBreadcrumbIndexByName(data.name);
						if(nameIndex > -1){
							f.breadcrumbFilters.splice(nameIndex,1);
						}

						if(data.query){
							if(data.name == 'resources')
								kbData.setResource(data.query);
							f.queryParams[data.name].value = "";
							if(data.id && data.name){
								f.queryParams[data.name].value = data.id+'';
								f.breadcrumbFilters.push(data);
							}
						}else{

							f.variableParams[data.name].value = [];
							if(data.name){
								f.variableParams[data.name].value.push(data.id);
								f.breadcrumbFilters.push(data);
							}

						}
						publish = true;
					}
				}

				if(publish){
					$rootScope.$emit('sp.kb.refresh.result',kbData.getResultQueryData());
					$rootScope.$emit('sp.kb.refresh.filter',kbData.getBreadcrumbFilters());
					if(data.categoryFiltered)
						kbData.fetchFilterData(data.categoryFiltered);
					else
						kbData.fetchFilterData();
					f.updateFacetSelections();
					f.updateURLParameters();
				}
			}
		});

		//Event thrown by keyword widget on change
		//update Sort, result and facet widgets
		$rootScope.$on('sp.kb.updated.keyword',function(event,data){
			f.resetOnKeywordChange(data);
		});

		f.getLanguageFiltersIndex  = function(id){
			for(var i = 0;i<f.languageFilters.length;i++){
				if(f.languageFilters[i] == id){
					return i;
				}
			}
			return -1;
		};
		//Event thrown by language picker widget on change
		//update result and facet widgets
		$rootScope.$on('sp.kb.updated.language',function(event,data){
			var publish = false;
			if(data){
				var dataIndex = f.getLanguageFiltersIndex(data.id);
				//if type multi then add/remove from languageFilters
				if(data.type == 'multi_select'){
					if(dataIndex < 0 && data.id && data.name){
						f.languageFilters.push(data.id);
						publish = true;
					}else if(!data.selected){
						f.languageFilters.splice(dataIndex,1);
						publish = true;
					}
				}else{
					//Else if type is single do nothing if already exist in breadcrumb
					if(dataIndex == -1){
						f.languageFilters = [];
						f.languageFilters.push(data.id);
						publish = true;
					}
				}
				if(publish){
					f.cachedFacetData = null;
					f.facetData = null;
					kbData.setLanguage();
					$rootScope.$emit('sp.kb.refresh.result',kbData.getResultQueryData());
					$rootScope.$emit('sp.kb.refresh.filter',kbData.getBreadcrumbFilters());
					kbData.fetchFilterData();
					f.updateFacetSelections();
					f.updateURLParameters();
				}
			}
		});

		//Event thrown by sort widget on change
		//Set order and direction
		//update result and facet widgets
		$rootScope.$on('sp.kb.updated.sortorder',function(event,data){
			if(data){
				kbData.setOrder(data.id);
				kbData.setOrderDesc(data.order_desc);
				$rootScope.$emit('sp.kb.refresh.result',kbData.getResultQueryData());
				kbData.fetchFilterData();
			}
		});

		//Event thrown by selected filters widget on change
		//update result and facet widgets
		$rootScope.$on('sp.kb.updated.filter',function(event,data){
			if(data){
				//Handle clear All selections
				if(data == 'clearall'){
					f.clearAllSelections();
				}else{

					if(data.name == f.selectionStack[f.selectionStack.length-1])
						f.selectionStack.pop();
					//Handle removal of muti select facet option
					if(data.type == 'multi_select'){
						if(f.variableParams[data.name]){
							var item = f.variableParams[data.name].value;
							item.forEach(function(i,$index){
								if(i == data.id){
									f.variableParams[data.name].value.splice($index,1);
									//break;
								}
							});
						}
					}else{
						//Handle removal of single select facet option

						if(data.query){
							f.queryParams[data.name].value = "";
							if(data.name == 'resources')
								kbData.setResource("");
						}else
							f.variableParams[data.name].value = [];
					}

					var brIndex = f.getBreadcrumbIndex(data);
					if(brIndex != -1)
						f.breadcrumbFilters.splice(brIndex,1);

					kbData.fetchFilterData();
				}

				$rootScope.$emit('sp.kb.refresh.result',kbData.getResultQueryData());
				f.updateFacetSelections();
				f.updateURLParameters();
			}
		});

		//Event thrown by facets with clear link
		//update result and facet widgets and breadcrumbs
		$rootScope.$on('sp.kb.updated.facet.selection',function(event,data){
			if(data){
				f.clearFacetSelectionsByName(data.name);
				kbData.fetchFilterData();
				$rootScope.$emit('sp.kb.refresh.result',kbData.getResultQueryData());
				$rootScope.$emit('sp.kb.refresh.filter',kbData.getBreadcrumbFilters());
				f.updateURLParameters();
			}
		});

		//Event thrown by langauge facet to clear the language
		$rootScope.$on('sp.kb.updated.language.selection',function(event,data){
			if(data){
				f.cachedFacetData = null;
				f.facetData = null;
				f.languageFilters = [];
				kbData.setLanguage();
				$rootScope.$emit('sp.kb.refresh.result',kbData.getResultQueryData());
				$rootScope.$emit('sp.kb.refresh.filter',kbData.getBreadcrumbFilters());
				kbData.fetchFilterData();
				f.updateFacetSelections();
				f.updateURLParameters();
			}
		});

		//Event thrown by Suggestion Selection
		//update the keyword and fetch the results
		$rootScope.$on('sp.kb.updated.suggestion',function (event,data){
			if(data){
				f.resetOnKeywordChange(data);
				$rootScope.$emit('sp.kb.refresh.keyword',{'keyword':data.keyword});
			}
		});

		$rootScope.$on('sp.kb.update.language.preferrance',function(event,data){
			if(data){
				f.savedLanguagePreferranceValue = data.lang;
			}
		});
		f.resetOnKeywordChange = function(data){
			if(data){
				kbData.setKeyword(data.keyword);
				if(data.keyword !=""){
					kbData.setOrder('relevancy');
					kbData.setOrderDesc(true);
				}else{
					kbData.setOrder($rootScope.dafaultSortId);
					kbData.setOrderDesc($rootScope.dafaultSortDesc);
				}
				f.cachedFacetData = null; //clear cache on query change
				f.clearAllSelections(); // clear all filter data
				$rootScope.$emit('sp.kb.refresh.suggestion',{'keyword':kbData.getKeyword(), 'language':kbData.getLanguage()});
				$rootScope.$emit('sp.kb.refresh.sortorder',{'order':kbData.getOrder(),'order_desc':kbData.isOrderDesc()});
				f.updateURLParameters();
			}
		};
		//Update selections to facets to show clear links
		f.updateFacetSelections = function(){
			var selectionData = {};
			f.breadcrumbFilters.forEach(function(key){
				if(!selectionData[key.name])
					selectionData[key.name] = "selected";
			});
			$rootScope.$emit("sp.kb.refresh.facet.selection",selectionData);
		};

		//Clear All Selections
		f.clearAllSelections = function(){
			f.breadcrumbFilters = [];

			angular.forEach(f.variableParams, function(obj, key) {
				if(obj.value.length > 0)
					f.variableParams[key].value = [];
			});

			angular.forEach(f.queryParams, function(obj, key) {
				if(obj.value != "")
					f.queryParams[key].value = "";
			});

			angular.forEach(f.facetData, function(value, key) {
				if(key != "meta")
					f.facetData[key] = [];
			});

			if(f.cachedFacetData != null){
				f.processFacetData(f.cachedFacetData);
			}else{
				//update all facets with new data
				$rootScope.$emit('sp.kb.refresh.facet',kbData.getFacetData());
				$rootScope.$emit('sp.kb.refresh.result',kbData.getResultQueryData());

				f.hasURLParams = false;
				kbData.fetchFilterData();
				f.updateFacetSelections();
				$rootScope.$emit('sp.kb.refresh.filter',kbData.getBreadcrumbFilters());

				//Broadcast update in article count for refine lable
				$rootScope.$emit('sp.kb.updated.article.count',{'count':'','loading':true});
			}

			f.selectionStack=[];

			kbData.setResource("");
		};

		//Clear given facet Selections
		f.clearFacetSelectionsByName = function(name){
			f.breadcrumbFilters.slice().reverse().forEach(function(item, index, object) {
				if (item.name === name) {
					f.breadcrumbFilters.splice(object.length - 1 - index, 1);
				}
			});

			if(f.selectionStack[f.selectionStack.length-1] == name){
				f.selectionStack.pop();
			}

			if(f.variableParams[name])
				f.variableParams[name].value = [];
			if(f.queryParams[name])
				f.queryParams[name].value = "";

			f.selectionStack.forEach(function(key, index, object){
				if(key == name)
					object.slice(index,1);
			});
			if(name == 'resources'){
				kbData.setResource("");
			}
		};

		//Reset All Selections
		f.restAllSelections = function(){
			f.breadcrumbFilters = [];
			f.urlParameterValues = {};

			angular.forEach(f.variableParams, function(obj, key) {
				if(obj.value.length > 0)
					f.variableParams[key].value = [];
			});

			angular.forEach(f.queryParams, function(obj, key) {
				if(obj.value != "")
					f.queryParams[key].value = "";
			});

			angular.forEach(f.facetData, function(value, key) {
				if(key != "meta")
					f.facetData[key] = [];
			});

			f.selectionStack=[];
			f.keyword = "";
			f.language = "";
			f.languageFilters = [];
			f.pageID = "";

			kbData.setResource("");
		};

		//Resolves if given facet should refresh with new data based on recent selections
		kbData.canUpdateFacet = function(value,oldData,newData,isCurrentFacetFiltered){
			if(isCurrentFacetFiltered)
				return false;

			if(newData.length == 0 || oldData.length < newData.length || f.selectionStack[f.selectionStack.length-1] != value)
				return true;

			return false;
		};

		//Used in facets to update their previous selection on change
		kbData.setSelections = function(items,dataSet){
			angular.forEach(items, function(iv, ik) {
				iv.selected = false;
				angular.forEach(dataSet, function(dv, dk) {
					if(iv.id == dv.id && dv.selected)
						iv.selected = true;
				});
			});

			return items;
		};

		f.initWithURLParams = function(){
			var urlParams = $location.search();

			//Set page id to validate change in page
			if(f.pageID == "")
				f.pageID = urlParams.id;

			//Only apply url changes if page is same
			if(f.pageID != urlParams.id)
				return;

			angular.forEach(urlParams, function(value, key) {

				if(f.urlActualParams[key] || f.urlAltParams[key]){
					f.hasURLParams = true;

					if(f.urlAltParams[key]){
						f.urlActualParams[f.urlAltParams[key]] = key;
						key = f.urlAltParams[key];
					}

					if(key == "query"){
						f.keyword = value;
						$rootScope.keyword = value;

					}else if(key == "language" && !f.variableParams[key]){
						if(value){
							var varlang = value.toString().split(",");
							varlang.forEach(function(v){
								f.languageFilters.push(v);
							});
							kbData.setLanguage();
						}

					}else if(f.variableParams[key]){
						if(value){
							var varVal = value.toString().split(",");
							f.urlParameterValues[key] = [];
							varVal.forEach(function(v){
								if(v == "-1")
									v = 'NULL_VALUE';

								f.variableParams[key].value.push(v);
								f.urlParameterValues[key].push(v);
							});
						}

					}else  if(f.queryParams[key]){
						if(value){
							var varQry = value.toString().split(",");
							varQry.forEach(function(v){
								f.queryParams[key].value = value;
								f.urlParameterValues[key] = value;
								if(key=="resources")
									f.resource = value;
							});
						}
					}
				}
				//else if(key != "id" && key != "spa" && key != "sysparm_kb_search_table"){
					//$location.search(key,null);
				//}
			});
		};

		f.findElement = function(data,tarId){
			var returnval = "";
			for(var i=0;i<data.length;i++){
				returnval = f.findNestedElement(data[i],tarId);
				if(returnval!=""){
					break;
				}
			}
			return returnval;
		};

		f.findNestedElement = function(item,tarId){
			var returnval = "";
			if(item.id==tarId.toLowerCase()){
				returnval=angular.copy(item);
				returnval.childs = [];
			}else if(item.childs.length>0){
				for(var i=0;i<item.childs.length;i++){
					returnval = f.findNestedElement(item.childs[i],tarId);
					if(returnval!=""){
						break;
					}
				}
			}
			return returnval;
		};
		f.initBreadcrumbData = function(data){
			f.breadcrumbFilters = [];
			var urlParmApplied = false;
			angular.forEach(f.urlParameterValues, function(value, key) {
				var facetData = data[key];
				if(key == "kb_category" && f.variableParams[key].treeData == true ){
					facetData = data.meta.categoryTree;
				}
				urlParmApplied = true;
				if(facetData && facetData.length > 0){
					if(key == "kb_category" && f.variableParams[key].treeData ==true){
						if($.isArray(value)){
							value.forEach(function(v){
								var catItem =  f.findElement(facetData,v);
								if(catItem!=""){
									catItem.name = key;
									catItem.type = f.faceTypeMap[key];
									f.selectionStack.push(key);
									f.breadcrumbFilters.push(catItem);
								}
							});
						}
					}else{
						facetData.forEach(function(k) {
							var fd = angular.copy(k);
							if($.isArray(value)){
								value.forEach(function(v){
									if(fd.id == v){
										if(v == "NULL_VALUE")
											fd.label = f.variableParams[key].title +" "+fd.label;
										fd.name = key;
										fd.type = f.faceTypeMap[key];
										f.selectionStack.push(key);
										f.breadcrumbFilters.push(fd);
									}
								});

							}else{
								if(fd.id == value || (key=="resources" && fd.query == value)){
									if(value == "NULL_VALUE")
										fd.label = f.variableParams[key].title +" "+fd.label;
									fd.name = key;
									f.selectionStack.push(key);
									f.breadcrumbFilters.push(fd);
								}
							}
						});
					}


				}
			});

			if(urlParmApplied && f.breadcrumbFilters.length == 0){
				var urlFilter = [];
				var obj = {};
				obj.label = 'kb_clear_url_filter';
				obj.id = "kb_clear_url_filter";
				obj.type = "single_select";
				obj.name = "clear_all";
				urlFilter.push(obj);
				$rootScope.$emit('sp.kb.refresh.filter',urlFilter);
			}else{
				$rootScope.$emit('sp.kb.refresh.filter',kbData.getBreadcrumbFilters());
			}
			f.hasURLParams = false;
			f.updateFacetSelections();
		};

		//update url on facet selection
		f.updateURLParameters = function(){
			$location.search("spa","1");
			$rootScope.refreshKBPage = false;

			if(f.keyword){
				$location.search(f.urlActualParams["query"],f.keyword);
			}else{
				$location.search(f.urlActualParams["query"],null);
			}

			if(f.language){
				$location.search(f.urlActualParams["language"],f.language);
			}else{
				$location.search(f.urlActualParams["language"],null);
			}

			angular.forEach(f.variableParams, function(obj, key) {
				if(obj.value.length > 0){
					$location.search(f.urlActualParams[key],obj.value.join());
				}else{
					$location.search(f.urlActualParams[key],null);
				}

			});

			angular.forEach(f.queryParams, function(obj, key) {
				if(obj.value != ""){
					$location.search(f.urlActualParams[key],obj.value);
				}else{
					$location.search(f.urlActualParams[key],null);
				}

			});

		};

		//validate breadcrumb object for new entry and return index if found
		f.getBreadcrumbIndex = function(entry){

			for(var i = 0;i<f.breadcrumbFilters.length;i++){
				if(f.breadcrumbFilters[i].name == entry.name && f.breadcrumbFilters[i].label == entry.label && f.breadcrumbFilters[i].id == entry.id){
					return i;
				}
			}
			return -1;
		};

		//Validate breadcrumb object for new entry based on name only and return index if found
		f.getBreadcrumbIndexByName = function(key){
			for(var i = 0;i<f.breadcrumbFilters.length;i++){
				if(f.breadcrumbFilters[i].name == key){
					return i;
				}
			}
			return -1;
		};

		//Check if object contains key
		f.vContains = function(data, id){
			for(var i = 0;i<data.length;i++){
				if(data[i] == id){
					return i;
				}
			}
			return -1;
		};

		//Generate encoded query from qury paramets and return string
		f.getEncodedQuery = function(type){
			var encodedeQuery = [];
			angular.forEach(f.queryParams, function(value, key) {
				if(key != 'resources' && value.value && value.filters){
					value.filters.forEach(function(v){
						if(value.value.toLowerCase() === v.id.toLowerCase()){
							v.query.forEach(function(qv){
								if(qv.table == "" || qv.table === type)
									encodedeQuery.push(qv.value);
							});
						}
					});
				}
			});
			return encodedeQuery.join("^");
		};

		//return variable raram data for results
		kbData.getResultVariableParams = function(){
			var obj = {};
			angular.forEach(kbData.getVariableParams(), function(value, key) {
				obj[key] = value.value;
			}, obj);

			return obj;
		};

		//Getters & Setters for service variables
		kbData.getKeyword = function(){
			return f.keyword;
		};

		kbData.getOrder = function(){
			return f.order;
		};

		kbData.isOrderDesc = function(){
			return f.order_desc;
		};

		kbData.getLanguage = function(){

			return f.language;
		};

		kbData.getFacetData = function(){
			return f.facetData;
		};

		kbData.getVariableParams = function(){
			return f.variableParams;
		};

		kbData.getVariableParamsByID = function(value){
			return f.variableParams[value];
		};

		kbData.getQueryParams = function(){
			return f.queryParams;
		};

		kbData.getBreadcrumbFilters = function(){
			return f.breadcrumbFilters;
		};

		kbData.setKeyword = function(value){
			f.keyword = value;
		};

		kbData.setOrder = function(value){
			f.order = value;
		};

		kbData.setOrderDesc = function(value){
			f.order_desc = value;
		};

		kbData.setLanguage = function(){
			var langStr = "";
			if(f.languageFilters && f.languageFilters.length>0){
				langStr = f.languageFilters.join(",");
			}
			f.language = langStr;
		};

		kbData.setFacetData = function(value){
			f.facetData = value;
		};
		kbData.getResource = function(){
			return f.resource;
		};
		kbData.setResource = function(value){
			f.resource = value;
		};
		kbData.setPaginationMinResCount = function(value){
			f.paginationMinResCount = value;
		};
		kbData.getPaginationMinResCount = function(){
			return f.paginationMinResCount;
		};
		kbData.unRegisterServiceEvents = function(){
			f.unRegLocationChange();
		};

		return kbData;

	}]);