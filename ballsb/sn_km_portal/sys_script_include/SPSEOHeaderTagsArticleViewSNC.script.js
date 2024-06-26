var SPSEOHeaderTagsArticleViewSNC = Class.create();
SPSEOHeaderTagsArticleViewSNC.prototype = Object.extendsObject(global.SPSEOHeaderTags, {

    type: 'SPSEOHeaderTagsArticleViewSNC',
	knowledgeRecord: null,
	pageId: '',
	isCrossLink: false,
	addNoIndexTagForMultiLang: false,
	
	/* 
	 * Initializing knowledge record based on URL parameters
	 */
	initializeKnowledgeRecord: function(isCrawler){
		var URLParameters = {};

		var queryParams = this.urlObj.queryParams;
		var params = queryParams.substr(queryParams.indexOf("?") + 1);
		var paramList = params.split("&");

		for(var i in paramList){
			var paramKeyVal = paramList[i].split("=");
			URLParameters[paramKeyVal[0]]=paramKeyVal[1];
		}

		var sys_kb_id = URLParameters.sys_kb_id || URLParameters.sys_id;
		this.pageId = URLParameters.id; 
		var kbViewModel = new global.KBViewModel();
		kbViewModel.shouldPopulateAdditionalInfo = false;
		if(isCrawler){
			if(!gs.nil(URLParameters.sysparm_article)){
				if(kbViewModel.isVersioningEnabled()){
					if (gs.nil(URLParameters.sysparm_version))
						kbViewModel.findLatestVersion(URLParameters.sysparm_article);
					else
						kbViewModel.findKnowledgeByVersion(URLParameters.sysparm_article,URLParameters.sysparm_version);
				}
				else{
					kbViewModel.findKnowledgeByNumber(URLParameters.sysparm_article + "");
				}
			}
			else if(!gs.nil(sys_kb_id))
				kbViewModel.findKnowledgeById(sys_kb_id);
			
			if(kbViewModel.isValid && kbViewModel.hasReplacementAvailable()) {
				var isValidRecord = kbViewModel.isValid;
				var articleIdentifier = URLParameters.hasOwnProperty('sys_kb_id') ? 'sys_kb_id' : URLParameters.hasOwnProperty('sysparm_article') ? 'sysparm_article' : 'sys_id';
				var replacementArticleId = null;

				while(isValidRecord && kbViewModel.hasReplacementAvailable()) {
					if(articleIdentifier === 'sysparm_article') {
						var replacementArticleNumber = kbViewModel.knowledgeRecord.getElement('replacement_article.number');
						kbViewModel = new global.KBViewModel();
						if(kbViewModel.isVersioningEnabled())
							kbViewModel.findLatestVersion(replacementArticleNumber);
						else
							kbViewModel.findKnowledgeByNumber(replacementArticleNumber);;
					} else {
						replacementArticleId = kbViewModel.knowledgeRecord.getValue('replacement_article');
						kbViewModel = new global.KBViewModel();
						var latestReplacementArticle = kbViewModel.getLatestAccessibleVersionFromId(replacementArticleId);
						var isLatest = (!gs.nil(latestReplacementArticle) && (latestReplacementArticle.getValue('version')!=knowledgeRecord.getValue('version')));
						replacementArticleId = isLatest? latestReplacementArticle.getValue('sys_id'):replacementArticleId;
						kbViewModel.findKnowledgeById(replacementArticleId);
					}

					isValidRecord = kbViewModel.isValid;
				}
				
				if(isValidRecord) {
					var url = this.urlObj.siteURL + "?id=" + this.pageId + "&" + articleIdentifier + "=" + replacementArticleId;
					kbViewModel.redirect(url);
				}
			}

			// Check if the article is expired, outdated or not accessible to public
			if (kbViewModel.knowledgeRecord &&
				!kbViewModel.isArticleExpired(kbViewModel.knowledgeRecord) &&
				kbViewModel.knowledgeRecord.workflow_state.getValue("workflow_state") != "outdated" &&
				kbViewModel.knowledgeRecord.canRead()) {
				
				this.knowledgeRecord = kbViewModel.knowledgeRecord;
				GlideAppCache.put("articleSysId", this.knowledgeRecord.sys_id+"");
				
				this.articleContent = '<h2>'+this.knowledgeRecord.short_description +"</h2><br/>" + '<div style="overflow-x:auto">' + kbViewModel.getArticleContent(false) + '</div>';
				
				this.isCrossLink = kbViewModel.isCrossLink("sn_km_portal.glide.knowman.serviceportal.seo_portals", this.urlObj.fullURL);
				

			} else {
				kbViewModel.setArticleUnavailabilityStatus();
			}
			
		}
	},
	
	/* 
	 * Generate hreflang array for the current language and the available translations
	 * @return array of objects containing locale and href
	 * [{locale:'fr-ca', href: 'https://instance.com/csp?id=kb_article_view&sysparm_article=KB0000001'}]
	 */
    generateHrefLangArray: function() {
		var items = [];
		if(GlidePluginManager().isActive('com.glideapp.knowledge.i18n2') && !gs.nil(this.knowledgeRecord) && !this.isCrossLink){
			var kbViewModel = new global.KBViewModel();
			var langList=kbViewModel.getLanguagesToDisplay(this.knowledgeRecord);
			var langObj = {};
			for(var i in langList){
				var lang = langList[i].language;
				var locale = this.localeMap[lang] || lang;
				if (locale) {
					langObj = {};
					langObj.locale = locale;
					
					//adding href lang url for all the translations with the sysparm_article parameter in the URL 
					langObj.href = this.urlObj.siteURL + "?id=" + this.pageId + "&sysparm_article=" + langList[i].number; 
					items.push(langObj);
				}
			}
		}
        return items;
    },
	
	/* 
	 * Generate Canonical URL with article number
	 * Should return fully qualified URL as string like 'https://instance.com/csp/?id=kb_article_view&sysparm_article=KB0000001'
	 * @return string : Canonical URL
	 */
    generateCanonicalURL: function() {
		var canonicalURL = "";
		
		if(!gs.nil(this.knowledgeRecord) && !this.isCrossLink){
			canonicalURL = (this.urlObj.siteURL + "?id=" + this.pageId + "&sysparm_article=" + this.knowledgeRecord.number); 
		}
        return canonicalURL;
    },
	
	//Add noindex robots tag for unaccessible, expired and retired articles
	generateCustomTagsForSEO: function(){ 
		var customTags = []; 
		if(gs.nil(this.knowledgeRecord) || this.addNoIndexTagForMultiLang){
			customTags.push("<meta name='robots' content='noindex' />");
		}
		else if(this.isCrossLink){ 
			customTags.push("<meta name='robots' content='noindex,nofollow' />"); 
		}
		return customTags; 
		
	},
	
	
	/* 
	 * Base function
	 * returns array of objects in below format
	 * {
	 *   canonicalURL : 'https://instance.com/csp/?id=kb_article_view&sysparm_article=KB0000001',
	 *   hrefLangs : [{locale:'fr-ca', href: 'https://instance.com/csp?id=kb_article_view&sysparm_article=KB0000001'}],
	 *   customSEOTags : ['<meta custom-tag=""  property="og:title" content="Service Portal">']
	 * }
	 */
    generateSEOTags: function(pageGR, isCrawler) {
		
		//initializing urlObj and Knowledge record
        this.urlObj = global.SPSEOHeaderTagsSNC.getURLObj();
		this.initializeKnowledgeRecord(isCrawler);

		var articleLang = GlidePluginManager().isActive('com.glideapp.knowledge.i18n2') && isCrawler ? this.knowledgeRecord.getValue('language') : '';
		if (articleLang && this.urlObj.lang && articleLang!= this.urlObj.lang){
			this.addNoIndexTagForMultiLang = true;
		}
		
        var items = {};
        items.canonicalURL = this.generateCanonicalURL();
        items.hrefLangs = this.generateHrefLangArray();
		items.customSEOTags = isCrawler ? this.generateCustomTagsForSEO(): [];
		items.customSEOHTML = isCrawler? this.articleContent: '';
        return items;
    },
});