(function($sp) {

	if(!input){
		//set instance sys_id to be used as unique id for collapse
		var preferredLang=gs.getUser().getPreference('knowledge.portal_search.langauge') || "";
		data.preferredLang = preferredLang;
		data.multiLangProperty = gs.getProperty("glide.knowman.enable_multi_language_search",false)+"";
		options.table = "kb_knowledge";
		options.field_name = "language";
		data.instanceid = $sp.getDisplayValue('sys_id');	
		options.min_scroll_count = options.min_scroll_count ? parseInt(options.min_scroll_count) : 10;
		options.alt_url_params = options.alt_url_params || "";

		var multiLangProperty = gs.getProperty("glide.knowman.enable_multi_language_search",false)+"";
		var facet_type = 'single_select';
		var template = "kb_language_single_select";
		if(multiLangProperty=="true"){
			facet_type = 'multi_select';
			template = "kb_language_multi_select";
		}
		options.facet_type = facet_type;
		options.template = template;
		data.template = options.template;
		var kbService = new KBPortalService();
		var valid_field = kbService.isValidFacetField(options.table,options.field_name,options.max_string_length);

		//Verification for Invalid Fields
		data.valid_field = valid_field;
		data.default_lang = gs.getProperty("glide.knowman.search.default_language") || gs.getSession().getLanguage() || 'en';
		data.messages = {};
		
		//Set keyword from url
		var languageParm = $sp.getParameter('language') || "";
	
		if(languageParm == ""){
			if(options.alt_url_params){
				var qParams =  options.alt_url_params.toString().split(",");
				qParams.forEach(function(key){
					if($sp.getParameter(key))
						languageParm = $sp.getParameter(key);
				});
			}
		}
		
		if(languageParm) 
			languageParm = languageParm.toLowerCase();
		
		var languages = [];
		//set the language from user preferrance
		if(languageParm == "" && preferredLang!=""){
			if(multiLangProperty=="true"){
				languageParm = preferredLang
			}else{
				 var prefLangs = preferredLang.split(',');
			   if(prefLangs.length==1){   //if single language is there  
					 languageParm = prefLangs[0];
				 }else{ //if multiple languages are there in pref value don't take anything and make it empty.
					 data.preferredLang = "";
				 }
			}
		}
		if(multiLangProperty=="false" && languageParm == ""){
		    languageParm = data.default_lang;
		}
		//Generate language object
		var languageList = kbService.getAvailableLanguages(languageParm);

		if(languageList){
			if(languageList.languages && languageList.languages.length > 0){
				languages = languageList.languages;
			}
		}
		data.languages = languages;
		data.messages.FILTER_OPTIONS_LABEL = gs.getMessage("Filter options");
		
	}else {
		if(input.requestType =="setUserPreference"){
			var language = input.prefLang;
				gs.getUser().savePreference('knowledge.portal_search.langauge',language);
		}
	}
})($sp);