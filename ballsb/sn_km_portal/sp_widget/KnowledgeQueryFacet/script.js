(function() {
	//set instance sys_id to be used as unique id for collapse
	data.instanceid = $sp.getDisplayValue('sys_id');	
	options.min_result_count = options.min_result_count ? parseInt(options.min_result_count) : 10;
	options.min_scroll_count = options.min_scroll_count ? parseInt(options.min_scroll_count) : 10;
	options.dynamic = options.dynamic ? options.dynamic == 'true' : false;
	options.alt_url_params = options.alt_url_params || "";
	data.is_admin = gs.hasRole("admin");
	data.messages = {};
	
	//aria labels
	data.messages.FILTER_LABEL = gs.getMessage("Filter");
	data.messages.OPTIONS_LABEL = gs.getMessage("options");
	data.messages.CLEAR_LABEL = gs.getMessage("Clear");
	
	
	 var msgs ={};
	msgs.more_ago = gs.getMessage("Past 2 Years");
	msgs.year_ago = gs.getMessage("Past Year");
	msgs.month_ago = gs.getMessage("Past Month");
	msgs.week_ago = gs.getMessage("Past Week");
	msgs.day_ago = gs.getMessage("Past 24 Hours");
	msgs.more_than_500 = gs.getMessage("More Than 500");
	msgs.more_than_200 =gs.getMessage("More Than 200");
	msgs.more_than_100 = gs.getMessage("More Than 100");
	msgs.more_than_50 = gs.getMessage("More Than 50");
	msgs.more_than_10 = gs.getMessage("More Than 10");
	msgs.less_than_10 = gs.getMessage("Less Than 10");
	msgs.rating_5 = gs.getMessage("4+ Rating");
	msgs.rating_4 = gs.getMessage("3+ Rating");
	msgs.rating_3 = gs.getMessage("2+ Rating");
	msgs.rating_2 = gs.getMessage("1+ Rating");
	msgs.rating_1 = gs.getMessage("Rated");
	msgs.rating_0 = gs.getMessage("Any Rating");
	msgs.ext=gs.getMessage("External content");
	msgs.int=gs.getMessage("Knowledge Base");
	
	
	options.facet_options = JSON.parse(options.facet_options);
	options.facet_options.forEach(function(item){
		if(msgs.hasOwnProperty(item.id))
			item.label = msgs[item.id];
	});
	options.facet_options = JSON.stringify(options.facet_options);
	
	var facet_type = 'single_select';
		if(options.custom_template){
			var tempAry = options.custom_template.toString().split(",");
			options.custom_template = tempAry[0];

			if(tempAry[1]){
				facet_type = tempAry[1];
			}
		}
    options.facet_type = facet_type;
	//get html template from options
	options.template = options.custom_template ? options.custom_template : (options.template ? options.template : "kb_facet_query_template");
	//get the template URL/path
	data.template = options.template;//$sp.translateTemplate(options.template);
})();