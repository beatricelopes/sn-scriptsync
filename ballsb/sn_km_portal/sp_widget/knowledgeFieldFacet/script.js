(function($sp) {

	if(!input){
		//set instance sys_id to be used as unique id for collapse
		options.table = "kb_knowledge";
		data.instanceid = $sp.getDisplayValue('sys_id');	
		options.min_result_count = options.min_result_count ? parseInt(options.min_result_count) : 10;
		options.min_scroll_count = options.min_scroll_count ? parseInt(options.min_scroll_count) : 10;
		options.max_string_length = options.max_string_length ? parseInt(options.max_string_length) : 80;
		options.aggregate_query = options.aggregate_query ? options.aggregate_query == 'true' : false;
		options.show_empty_value = options.show_empty_value ? options.show_empty_value == 'true' : false;
		options.alt_url_params = options.alt_url_params || "";

		data.facet_depth = parseInt(gs.getProperty('glide.knowman.search.facet_depth') || 300);
		data.category_as_tree = options.category_as_tree ? options.category_as_tree == 'true' : false;
		data.messages = {};
		
		var facet_type = 'single_select';
		if(options.custom_template){
			var tempAry = options.custom_template.toString().split(",");
			options.custom_template = tempAry[0];

			if(tempAry[1]){
				facet_type = tempAry[1];
			}
		}else if(options.template){
			if(options.template == 'kb_facet_multi_select'){
				facet_type = 'multi_select';
			}else if(options.template == 'kb_facet_dropdown_select'){
				facet_type = 'dropdown_select';
			}
		}
		
		//get html template from options
		options.template = options.custom_template ? options.custom_template : (options.template ? options.template : "kb_facet_single_select");
		//get the template URL/path
		data.template = options.template;//$sp.translateTemplate(options.template);

		if(options.field_name == "kb_category" && data.category_as_tree){
			data.template = "kb_facet_tree_category_select";
			facet_type = 'single_select';
		}
		 options.facet_type = facet_type;
		
		var kbService = new KBPortalService();
		var valid_field = kbService.isValidFacetField(options.table,options.field_name,options.max_string_length);

		//Verification for Invalid Fields
		data.valid_field = valid_field;
		data.is_admin = gs.hasRole("admin");
		//aria labels
        data.messages.FILTER_LABEL = gs.getMessage("Filter");
		data.messages.OPTIONS_LABEL = gs.getMessage("options");
		data.messages.CLEAR_LABEL = gs.getMessage("Clear");
	}else{
		if(input){
			var result = {};
			var facetService = new KBPortalService();
			result = facetService.getFacetByName(
				input.name,
				input.value,
				input.keyword,
				input.language,
				input.variables,
				input.query,
				input.order,
				input.portal_suffix
			);
			data.result = result;
		}
	}
})($sp);