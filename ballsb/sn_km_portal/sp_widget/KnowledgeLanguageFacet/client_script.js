function($scope,$rootScope,$compile,$timeout,KnowledgeSearchService) {
	/* widget controller */
	var c = this;
	c.data = c.data;
	c.showRange = c.options.min_scroll_count;
	c.options.title = c.options.title || "${Language}";
	c.error_text = "${Missing/Invalid Facet Options}";
	c.valid_field = c.data.valid_field;
	c.kind = "language";
	c.name = c.options.field_name;
	c.selected = "";
	c.reset =false;
	c.items = [];
	c.clear = false;
	if(c.options.facet_type !="multi_select"){
		c.defaultVal = c.data.default_lang;
		c.reset = true;
	}else{
		c.defaultVal = "";
	}
	c.items = [];
	if(c.options.field_name && c.options.table && !c.valid_field && c.data.template)
		c.error_text = "${Field Type Not Supported}";

	c.options.instanceid = c.data.instanceid;
	c.visible = false;
	c.collapse = false;
	c.clear = false;

  if(c.data.preferredLang != ""){
	   $rootScope.$emit('sp.kb.update.language.preferrance',{'lang':c.data.preferredLang});
	}

	if(c.name && c.options.table && c.valid_field && c.data.template){
		var input = {};
		input.name = c.name;
		input.element = "language";
		input.table = c.options.table;
		input.kind = c.kind;
		input.type = c.options.facet_type;
		input.alt_url_params = c.options.alt_url_params;
		input.defaultValue = c.defaultVal;

		//Subscribe itself to search service on load
		KnowledgeSearchService.subscribe(input);

		if(c.data.languages && c.data.languages.length > 1){
			$rootScope.showLanguageIcon = true;
			c.items = c.data.languages;
			c.selection = "";
			c.visible = true;
		}
	}

	c.rowClickCheckbox = function(item){
		var targetEle = event.target;
		if(item){
			var checkboxObjArray = $(targetEle).find('input:checkbox');
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
		c.items.forEach(function(item1){
			item1.selected = false; 
		});
		item.selected = true;
		c.updateKbFilterData(item);
	}
	c.reset = function(event){
		event.stopPropagation();
		var item1;
		if(c.items){
			c.items.forEach(function(item){
				if(item.id ==c.data.default_lang){
						item.selected = true; 
					  item1 = item;
				}else{
					item.selected = false; 
				}
			});
		}
		c.updateKbFilterData(item1);
	}
	c.updateKbFilterData =function(item){
		if(item){
			var data = {};
			data.name = c.name;
			data.type = c.options.facet_type;
			data.label = item.label;
			data.id = item.id;

			if(c.options.facet_type == 'multi_select')
				data.selected = item.selected;
			$rootScope.$emit('sp.kb.updated.language',data);
		}
		var input ={};
		var selectedLangs = [];
		input.requestType = "setUserPreference";
		c.items.forEach(function(item1){
			if(item1.selected){
				selectedLangs.push(item1.id);
			}
		});
		if(selectedLangs.length>0)
			input.prefLang = selectedLangs.join();
		else
			input.prefLang = "";
		c.server.get(input).then(function(r){

		});
	};

	c.clearSelections = function(event){
		event.stopPropagation();
		if(c.items){
			c.items.forEach(function(item){
				item.selected = false; 
			});
		}
		c.clear = false;
		$rootScope.$emit("sp.kb.updated.language.selection",{"name":c.name});
	};
}