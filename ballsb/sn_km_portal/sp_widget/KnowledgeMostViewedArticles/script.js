(function() {
	if(input)
		return;
	else {
	options.aria_label_title = options.title || gs.getMessage('Most Viewed Articles');
	options.title = options.title || gs.getMessage('Most Viewed');
	options.display_field = options.display_field || "short_description"; 
	options.secondary_fields = options.secondary_fields ? options.secondary_fields.split(",") : getKnowledgeFieldsfromProperties();
	options.show_secondary_fields_label = options.show_secondary_fields_label ? options.show_secondary_fields_label == 'true' : false;
	options.max_records = options.max_records || gs.getProperty('glide.knowman.content_block_limit')|| '5';
	options.always_show = options.always_show ? options.always_show == 'true' : true;
	options.reverse = true;


	var kbService = new KBPortalService();
	options.knowledge_base =  options.knowledge_base || String(kbService.getServicePortalKnowledgeBases($sp.getPortalRecord().url_suffix)) || "";
	var result = [];

	var kbData = kbService.getMostViewedArticles(options.max_records,options.display_field,options.secondary_fields,options.knowledge_base);
	if(kbData)
		result= kbData;

	options.result = result;
	data.template = $sp.getWidget("kb-list-widget-template", options);
	}


	function getKnowledgeFieldsfromProperties(){

		//Generate secondary fields based on legacy properties
		var fields = [];

		if(gs.getProperty('glide.knowman.search.show_article_number','false') == 'true'){
			var kbMod = new global.KBViewModel();
			if(kbMod.isVersioningEnabled()){
				fields.push('display_number');
			}else{
				fields.push('number');
			}
		}
		if(gs.getProperty('glide.knowman.search.show_author','false') == 'true')
			fields.push('author');
		if(gs.getProperty('glide.knowman.search.show_view_count','false') == 'true')
			fields.push('sys_view_count');		
		if(gs.getProperty('glide.knowman.search.show_last_modified','false') == 'true')
			fields.push('sys_updated_on');
		if(gs.getProperty('glide.knowman.search.show_published','false') == 'true')
			fields.push('published');
		if(gs.getProperty('glide.knowman.show_unpublished','false') == 'true')
			fields.push('workflow_state');
		if(gs.getProperty('glide.knowman.search.show_rating','false') == 'true')
			fields.push('rating');

		return fields;
	}
})();