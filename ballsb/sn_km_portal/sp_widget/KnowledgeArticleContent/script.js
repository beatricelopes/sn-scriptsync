data.tsQueryId = $sp.getParameter("sysparm_tsqueryId") || "";
var isMESP = (options.is_mobile && options.is_mobile == "true") || ($sp.getParameter("id") == "me_kb_view") || false;
data.isMESP = isMESP;
options.kb_rating_style = options.kb_rating_style ? options.kb_rating_style == "true" : true;
var portalRecord = $sp.getPortalRecord();
var portal = portalRecord.getUniqueValue();
data.showKbHomeLink = (portal != '45d6680fdb52220099f93691f0b8f5ad');

if(!input){
	var kbViewModel = new global.KBViewModel();
	data.isCrawlerBot = kbViewModel.checkCrawlerBot();
	data.messages = {};
	populateParameters();

	if(data.isCrawlerBot){
		kbViewModel.findKnowledgeById(GlideAppCache.get("articleSysId"));
		var knowledgeRecord = kbViewModel.knowledgeRecord;
		var isValidRecord = kbViewModel.isValid;
		if (options.redirect_latest == 'true' && isValidRecord && knowledgeRecord && !knowledgeRecord.article_id.nil()) {
			var latest = kbViewModel.getLatestAccessibleVersionFromId(knowledgeRecord.article_id);
			var newVersionAvailable = !gs.nil(latest) && (latest.getValue('version')!=knowledgeRecord.getValue('version'));
			if(newVersionAvailable){
				data.params.sys_kb_id = latest.getValue('sys_id');
				data.redirect = data.params.sys_kb_id;
				kbViewModel = new global.KBViewModel();
				kbViewModel.getInfoForSP(data.params);
				isValidRecord = kbViewModel.isValid;
				knowledgeRecord = kbViewModel.knowledgeRecord;
			}
		}	
		data.knowledgeExists = kbViewModel.knowledgeExists;
		if (isValidRecord && knowledgeRecord) {
			data.isKBAdmin = kbViewModel.isAdminUser(knowledgeRecord);
			data.isArticleExpired = kbViewModel.isArticleExpired(knowledgeRecord);
			if (data.isArticleExpired && !data.isKBAdmin) {
				data.messages.ARTICLE_EXPIRED = gs.getMessage("This knowledge item has expired");
			} 
			else {data.isKBOwner = (gs.getUserID() == knowledgeRecord.kb_knowledge_base.owner);
				populateDataForCrawler();
				kbViewModel.setTableName(knowledgeRecord.getTableName() + "");
				data.attachments = kbViewModel.getAttachments();
				populateMessages();
				data.page_title = getPageTitle();
				data.meta_tag = getMetaTag();

				if(data.articleType === 'wiki'){
					initGlideWiki();
				}

				data.shortDesc = knowledgeRecord.short_description.getDisplayValue() + "";
			}
		}
		else{
			data.messages.INSUFFICIENT_PREVILEGES = gs.getMessage("You do not have sufficient privileges to access this knowledge item");
			data.messages.RECORD_NOT_FOUND = gs.getMessage("Knowledge record not found");
		}
	}
	
	else{
	
		var hasViewAsUserAccess = true;
		
		if(!gs.nil(data.params.view_as_user)){
			var response = isUserAllowedToViewAs(data.params);
			
			if(response.hasAccess == false){
				data.messages.INSUFFICIENT_PREVILEGES = response.message;
			data.isValid = false;
			data.knowledgeExists = true;
				hasViewAsUserAccess = false;
			}
		}
			
		if(hasViewAsUserAccess){
		kbViewModel.setShowVersionHistory(options.show_version_info);
		kbViewModel.getInfoForSP(data.params);

		var isValidRecord = kbViewModel.isValid;
			var canAdminOverrideRedirect = ($sp.getParameter('sysparm_redirect') + '' === 'false') && kbViewModel.isAdminUser(kbViewModel.knowledgeRecord);
			
			if(isValidRecord && !canAdminOverrideRedirect) {
				var articleIdentifier = !gs.nil(data.params.sysparm_article) ? 'sysparm_article' : (!gs.nil(data.params.sys_kb_id) ? 'sys_kb_id' : 'sys_id');
				var baseArticleURL = $sp.getPortalRecord().getDisplayValue('url_suffix') + '?id=' + $sp.getParameter('id') + '&' + articleIdentifier + '=' + data.params[articleIdentifier] + '&sysparm_redirect=false';
				
				if(kbViewModel.isAdminUser(kbViewModel.knowledgeRecord)) {
					data.replacementAlert = gs.getMessage("The article <a href={0}>{1}</a> has been retired and replaced with the current article.", [baseArticleURL, kbViewModel.knowledgeRecord.getValue('number')]);					
				} else {
					data.replacementAlert = gs.getMessage("The article {0} has been retired and replaced with the current article.", [kbViewModel.knowledgeRecord.getValue('number')]);				
				}
				
				while(isValidRecord && kbViewModel.hasReplacementAvailable()) {
					if(articleIdentifier === 'sysparm_article') {
						data.params[articleIdentifier] = kbViewModel.knowledgeRecord.getElement('replacement_article.number') + '';						
						delete data.params["sys_kb_id"];
						delete data.params["sys_id"];

					} else {
						data.params[articleIdentifier] = kbViewModel.knowledgeRecord.getValue('replacement_article');
						var latestReplacementArticle = kbViewModel.getLatestAccessibleVersionFromId(data.params[articleIdentifier]);
						var isLatest = (!gs.nil(latestReplacementArticle) && (latestReplacementArticle.getValue('version')!=kbViewModel.knowledgeRecord.getValue('version')));
						data.params[articleIdentifier] = isLatest? latestReplacementArticle.getValue('sys_id'):data.params[articleIdentifier];						
						delete data.params["sysparm_article"];
					}

					data.replacementArticleId = data.params[articleIdentifier];
					
					kbViewModel = new global.KBViewModel();
					kbViewModel.setShowVersionHistory(options.show_version_info);
					kbViewModel.getInfoForSP(data.params);
					
					isValidRecord = kbViewModel.isValid;
				}
			}
			
		if (options.redirect_latest == 'true' && isValidRecord && kbViewModel.knowledgeRecord && kbViewModel.versioningInfo.newVersionAvailable) {	
			data.params.sys_kb_id = kbViewModel.versioningInfo.newVersion.getValue('sys_id');
			data.redirect = data.params.sys_kb_id;
			kbViewModel = new global.KBViewModel();
			kbViewModel.getInfoForSP(data.params);
			isValidRecord = kbViewModel.isValid;
		}	
		
			var knowledgeRecord = kbViewModel.knowledgeRecord;
			
			if(isValidRecord && data.params.view_as_user.length > 0 && knowledgeRecord.getValue("view_as_allowed") == 0)
				isValidRecord = false;
			
		var kbPortal = new KBPortalService();
		data.knowledgeExists = kbViewModel.knowledgeExists;
		data.kb_knowledge_page = $sp.getDisplayValue("kb_knowledge_page") || "kb_view2";
		data.langList = [];
		var tsQueryId = $sp.getParameter("sysparm_tsqueryId");
		var rank = $sp.getParameter("sysparm_rank");
		if(tsQueryId && rank && tsQueryId != ""){
			kbViewModel.updateTsQueryKbWithRank(tsQueryId,rank);
		}

		options.knowledge_bases = options.knowledge_bases || String(kbPortal.getServicePortalKnowledgeBases($sp.getPortalRecord().url_suffix)) || "";
		
		
		if(options.knowledge_bases && knowledgeRecord && knowledgeRecord.kb_knowledge_base ){
			if(options.knowledge_bases.indexOf(knowledgeRecord.kb_knowledge_base) == -1)
				isValidRecord = false;
		}
			
		data.isArticleExpired = false;
			data.viewAsUser = data.params.view_as_user;

		if (isValidRecord && knowledgeRecord) {
			data.isKBAdmin = kbViewModel.isAdminUser(knowledgeRecord);
			data.isArticleExpired = kbViewModel.isArticleExpired(knowledgeRecord);
			if (data.isArticleExpired && !data.isKBAdmin) {
				data.messages.ARTICLE_EXPIRED = gs.getMessage("This knowledge item has expired");
			} else {
				data.isKBOwner = (gs.getUserID() == knowledgeRecord.kb_knowledge_base.owner);
				populateDataFromKBViewModel();
				// fetching default page title to support km seo
				data.page_title = getPageTitle();
					data.meta_tag = getMetaTag();
				populateMessages();
				populateCommonProperties();
				if(!isMESP){
				populateBreadCrumbs();
				populateVersionInfo();
				}
				handleViewCountIncrement();
				if(!isMESP)
				populateContributorInfo();


				if(data.articleType === 'wiki'){
					initGlideWiki();
				}

				data.sys_updated_on = "";
				if (kbViewModel.publishedRecord) {
					published = kbViewModel.publishedRecord.published;
					data.sys_updated_on = kbViewModel.publishedRecord.sys_updated_on + "";
				}

				data.shortDesc = knowledgeRecord.short_description.getDisplayValue() + "";

				populateSystemProperties();
				getFeedbackReasonValues();
				if(data.properties.showAffectedProducts === 'true' || data.properties.showAffectedProducts === true){
					populateAffectedProducts();
				}

				if(data.properties.showAttachedTasks === true || data.properties.showAttachedTasks === 'true'){
					populateAttachedTasks();
				}

			data.favoriteWidget = $sp.getWidget('ec_favorite', {'table': 'kb_knowledge', 'sys_id': data.article_sys_id});

				$sp.logStat('KB Article View', "kb_knowledge", knowledgeRecord.sys_id, knowledgeRecord.short_description);
			}
		}
		else{
			data.messages.INSUFFICIENT_PREVILEGES = gs.getMessage("You do not have sufficient privileges to access this knowledge item");
			data.messages.RECORD_NOT_FOUND = gs.getMessage("Knowledge record not found");
		}
	}
}
}

if(input){
	if(input.action === 'saveFlagComment'){
		var kbPortal = new KBPortalService();
		var params = {};
		params.sysparm_id = input.article_sys_id;
		params.feedback = input.comment;
		params.sysparm_flag = "true";
		params.ts_queryId = data.tsQueryId;
		var response = kbPortal.kbWriteCommentWithParams(params);
		var resp = new global.JSON().decode(response);

		data.feedbackSuccess=resp.success;
	}
	if(input.action == 'createFeedbackTask'){
		var response;
		var kbPortal = new KBPortalService();
		var successMessage = options.feedback_message ? options.feedback_message : gs.getMessage('Thank you, we appreciate your feedback');
		var max_daily_comments = gs.getProperty("glide.knowman.max_comments_per_user_daily",'0');
		var failureMessage = parseInt(max_daily_comments)>0? gs.getMessage("You have reached the daily limit for comments posted by a user."):gs.getMessage('Failed to save feedback');
		var params = buildParams();
		params.reason = input.reason;
		params.comments = input.details;
		if(input.feedback_action == "useful_no"){
			params.useful = "no";
			response = kbPortal.saveUsefulWithParams(params) + '';
		}else if(input.feedback_action == "rating"){
			params.rating = input.rating;
			response = kbPortal.saveStarRatingWithParams(params) + '';
		}
		data.responseMessage = response.includes('true') ? successMessage : failureMessage;
		var resp = new global.JSON().decode(response);
		data.feedbackSuccess = resp.success;
	}
	if(input.action === 'subscribe'){
		var subResult = subscribeObject('Article', input.articleSysId, gs.getUserID());
		if(subResult){
			data.responseMessage = gs.getMessage("You are now subscribed to {0}. You will be notified of any new activity according to your notification settings.", input.articleNum);
		}
	}
	if(input.action === 'unsubscribe'){

		var subResult = false;
		if(input.unsubscribeKB){
			subResult = unsubscribeObject('KB', input.articleSysId, input.kbSysId);
			if(subResult === 'Article'){
				data.responseMessage = gs.getMessage("Your subscriptions to {0} Knowledge Base and {1} have been removed.", [input.kbName, input.articleNum]);
			}
			else{
				data.responseMessage = gs.getMessage("Your subscription to {0} Knowledge Base has been removed.", input.kbName);
			}
		}
		else{
			subResult = unsubscribeObject('Article', input.articleSysId, null);
			if(subResult){
				data.responseMessage = gs.getMessage("Your subscription to {0} has been removed.", input.articleNum);
			}
		}
	}

	 if(input.action == 'kbAttachArticle'){
		var kAjax = new global.KnowledgeAjax();
		data.articleContent = kAjax.kbAttachArticleImpl(input.value);
	}
}

function buildParams(){
	var params = {};
	params.article = input.article_sys_id;
	params.sysparm_id = input.article_sys_id;
	params.ts_queryId = data.tsQueryId;
	params.session_id = gs.getSessionID();
	params.user = gs.getUserID();
	return params;
}

function subscribeObject(type, sysId, userId){
	var kAjax = new global.KnowledgeAjax();
	return kAjax.subscribeKbArticle(sysId, "7d8f537453003200fa9bd7b08cc5872c");
}

function unsubscribeObject(type, articleSysId, kbSysId){
	var kAjax = new global.KnowledgeAjax();
	if(type === 'Article'){
		return kAjax.unsubscribeKbArticle(articleSysId);
	}
	else{
		return kAjax.unsubscribeKB(articleSysId, kbSysId);
	}
}

function populateMessages(){

	data.messages.REASON = gs.getMessage("Reason");
	data.messages.DETAILS = gs.getMessage("Details");
	data.messages.FEEDBACK = gs.getMessage("Feedback");
	data.messages.THANKYOU_FEEDBACK = gs.getMessage("Thank you for the feedback");
	data.messages.ADDTIONAL_DETAILS = gs.getMessage("Please provide additional details");
	data.messages.NO_THANKS = gs.getMessage("No thanks");
	data.messages.ADD_DETAIL = gs.getMessage("Add a Detail Comment");
	data.messages.ARTICLE_FLAGGED = gs.getMessage("Article has been flagged");
	data.messages.FLAG_THIS_ARTICLE = gs.getMessage("Flag this article");
	data.messages.ADD_COMMENT = gs.getMessage("Add a comment (mandatory)");
	data.messages.NOT_RETIRED = gs.getMessage("Article not retired");
	data.messages.NOT_PUBLISHED = gs.getMessage("Article not published");
	data.messages.NOT_SAVED = gs.getMessage("Article not saved");
	data.messages.SAVED = gs.getMessage("Article saved");
	data.messages.HOME = gs.getMessage('Home');
	data.messages.DISCARDED = gs.getMessage("Article changes discarded");
	data.messages.SUBMITTED = gs.getMessage("Your article has been submitted");
	data.messages.PREVIEW = gs.getMessage(" Preview ");
	data.messages.PREVIEW_HINT = gs.getMessage("Preview changes");
	data.messages.DELETE = gs.getMessage("Delete");
	data.messages.CONFIRM_DELETE = gs.getMessage("Confirm deletion of this article?");
	data.messages.TITLE_CANCEL = gs.getMessage("Cancel changes");
	data.messages.MESSAGE_CANCEL = gs.getMessage("Discard all changes?");
	data.messages.TITLE_RETIRE = gs.getMessage("Retire");
	data.messages.MESSAGE_RETIRE = gs.getMessage("Retire this article?");
	// Status messages for the message bar.
	data.messages.DRAFT_MSG = gs.getMessage("This knowledge item has been created");
	data.messages.REVIEW_MSG = gs.getMessage("This knowledge item has been published");
	data.messages.PUBLISHED_MSG = gs.getMessage("This knowledge item has been published");
	data.messages.PEND_RETIRE_MSG = gs.getMessage("This knowledge item has been retired");
	data.messages.RETIRED_MSG = gs.getMessage("This knowledge item has been retired");
	data.messages.DELETE_FAIL_MSG = gs.getMessage("This article could not be deleted");
	data.messages.TXT_PLACEHOLDER = gs.getMessage("Add content");
	data.messages.LATEST_VERSION = gs.getMessage("Latest version");
	data.messages.SUBSCRIBE = gs.getMessage("Subscribe");
	data.messages.UNSUBSCRIBE = gs.getMessage("Unsubscribe");
	data.messages.COPY_PERMALINK = gs.getMessage("Copy Permalink");
	data.messages.SUBMIT = gs.getMessage('Submit');
	data.messages.COMMENTS = gs.getMessage('Comments');
	data.messages.AFFECTED_PRODUCTS = gs.getMessage('Affected Products');
	data.messages.OUTDATED = gs.getMessage('Outdated');
	data.messages.KNOWLEDGE_BASE = gs.getMessage('Knowledge Base');
	data.messages.KNOWLEDGE = gs.getMessage('Knowledge');
	data.messages.ATTACHED_INCIDENTS = gs.getMessage("Most recent tasks");
	data.messages.THANK_YOU = gs.getMessage("Thank you");
	data.messages.RATE_LIMIT_REACHED = gs.getMessage("You have reached the daily limit for comments posted by a user.");
	data.messages.NO_ATTACHMENTS = gs.getMessage("No attachments found");
	data.messages.NO_INCIDENTS = gs.getMessage("No tasks found");
	data.messages.NO_PRODUCTS = gs.getMessage("No affected products found");
	data.messages.EDIT = gs.getMessage("Edit Article");
	data.messages.ATTACHMENTS = gs.getMessage('Attachments');
	data.messages.CREATE_INCIDENT = gs.getMessage("Create Incident");
	data.messages.FLAG_ARTICLE = gs.getMessage("Flag Article");
	data.messages.PERMALINK_COPIED = gs.getMessage("Permalink copied successfully");
	data.messages.SUBSCRIPTION_CONFIRMATION = gs.getMessage("You are now subscribed to {0}. You will be notified of any new activity according to your notification settings", data.number);
	data.messages.SUBSCRIBED = gs.getMessage("Subscribed");
	data.messages.YES = gs.getMessage("Yes");
	data.messages.NO = gs.getMessage("No");
	data.messages.UNSUBSCRIBE_CONTENT = gs.getMessage("In order to unsubsrcibe from this article, you will need to unsubscribe from the parent knowledge base: {0}. ", data.kbName);
	data.messages.UNSUBSCRIBE_CONFIRMATION = gs.getMessage("Would you like to unsubscribe from {0}", data.kbName);
	data.messages.CANCEL = gs.getMessage("Cancel");
	data.messages.ACTION_MENU = gs.getMessage("More actions.");
	data.messages.ACTION_MENU_LABEL = gs.getMessage("Actions");
	data.messages.CLOSE = gs.getMessage("Close");
	data.messages.JUST_NOW = gs.getMessage("just now");
	data.messages.ARTICLE_RATING = gs.getMessage("Average article rating - {0} out of 5 stars", data.avgRating);
	data.messages.EXTERNAL_CONTENT = gs.getMessage(gs.getProperty("sn_km_intg.glide.knowman.external.ui_label_for_external_content", "External Content"));
	data.messages.DOWNLOAD_DOCUMENT = gs.getMessage('Download as Word (.docx)');
	data.messages.COLLAPSED_FIELD = gs.getMessage('section is in collapsed mode');
	data.messages.EXPANDED_FIELD = gs.getMessage('section is in expanded mode');
	
	if(data.params.sysparm_kb_search_table){
		var label = new GlideRecord(data.params.sysparm_kb_search_table).getLabel();
		if(label)
			data.messages.ATTACH_TO_TASK_LABEL = gs.getMessage("Attach to {0}", label);
		else
			data.messages.ATTACH_TO_TASK_LABEL = gs.getMessage("Attach to record");
	}
}

function populateParameters(){
	data.params = {};
	data.params.sysparm_article = $sp.getParameter('sysparm_article');
	data.params.sysparm_language = $sp.getParameter('sysparm_language');
	data.params.sys_kb_id = $sp.getParameter('sys_kb_id') || $sp.getParameter('sys_id');
	data.params.sysparm_no_update = $sp.getParameter('sysparm_no_update');
	data.params.sysparm_no_suggest = $sp.getParameter('sysparm_no_suggest');
	data.params.sysparm_no_info = $sp.getParameter('sysparm_no_info');
	data.params.sysparm_no_create_incident = $sp.getParameter('sysparm_no_create_incident');
	data.params.sysparm_ts_queryId = $sp.getParameter('sysparm_tsqueryId');
	data.params.sysparm_article_view_page_id = $sp.getParameter('id');
	data.params.view_as_user = $sp.getParameter('view_as_user') || '';
	data.params.extension_type = $sp.getParameter('extension_type') || '';
	
	if(data.params.view_as_user.length > 0)
		data.params.override_LoggedInUser_Access = true;

	data.params.sysparm_kb_search_table = $sp.getParameter('sysparm_kb_search_table')||'';
}

function populateSystemProperties(){
	data.properties = {};

	data.properties.showStarRating = getProperty("glide.knowman.show_star_rating", "show_star_rating", true, true);
	data.properties.showRatingOptions = getProperty("glide.knowman.show_rating_options", "show_rating_options", true, true);
	data.properties.showYesNoRatings = getProperty("glide.knowman.show_yn_rating", "show_yn_rating", true, true);
	//data.properties.showFlagArticle = getProperty("glide.knowman.show_flag", "show_flag", true, true);
	//data.properties.showFlagArticle = data.properties.showFlagArticle && !params.sysparm_no_suggest && !knowledgeRecord.disable_suggesting;

	data.properties.showUserComments = getProperty("glide.knowman.show_user_feedback", "show_user_feedback", 'onload');
	data.properties.showAffectedProducts = gs.getProperty('glide.knowman.affected_products.display','true');
	data.properties.showAttachedTasks = gs.getProperty('glide.knowman.recent_tasks.display','true');

	data.properties.attachFields = gs.getProperty('glide.knowman.attach.fields');
	if(data.properties.showAttachedTasks === 'true'){
		data.properties.showAttachedTasks = gs.hasRole('itil') || gs.hasRole('knowledge');
	}
	data.properties.showCreateIncident = !kbViewModel.isInPopup && !data.params.sysparm_no_create_incident;
	data.properties.createIncidentURL = getProperty('glide.knowman.create_incident_link', 'create_incident_link', '', false);
	data.properties.isSubscriptionEnabled = kbViewModel.isSubscriptionEnabled;


	data.properties.isEditable = kbViewModel.isEditable;
	data.properties.showFeedBack = kbViewModel.showKBFeedback;
	data.properties.showKBRatingOptions =	kbViewModel.showKBRatingOptions;

	data.properties.showKBHelpfullRating =	kbViewModel.showKBHelpfullRating;
	data.properties.showKBStarRating = kbViewModel.showKBStarRating;

	data.properties.showKBCreateIncident =	kbViewModel.showKBCreateIncident;// && !kbViewModel.isInPopup && !params.sysparm_no_create_incident;
	data.properties.showKBFlagArticle = kbViewModel.showKBFlagArticle && !data.params.sysparm_no_suggest && !knowledgeRecord.disable_suggesting;
	data.properties.showKBUpdateAction =	kbViewModel.showKBUpdateAction;
	
	data.properties.readOnlyPage = gs.getProperty('glide.knowman.contextual_search.show_read_only_article','false');
}
function getProperty(propertyName, optionName, defaultValue, checkRoles){
	var optionVal = options[optionName];
	if(!optionVal || optionVal === 'use_system' || !(optionVal === 'yes' || optionVal === 'no') ){
		var propValue = gs.getProperty(propertyName, defaultValue);
		if(propValue && checkRoles){
			var roles = gs.getProperty(propertyName + '.roles');
			if (roles != null && roles != ''){
				propValue = gs.hasRole(roles);
			}
		}
		return propValue;
	}
	else {
		return optionVal === 'yes' ? true : false;
	}
}

function populateCommonProperties(){
	data.isMobileView = ($sp.getParameter('sysparm_device') != "" && $sp.getParameter('sysparm_device') == "mobile");
	data.isKBLanguagesNewUI = GlidePluginManager.isActive('com.glideapp.knowledge.i18n2');
	if(data.isKBLanguagesNewUI){
		data.langList = kbViewModel.getLanguagesToDisplay(knowledgeRecord);
	}
}

function populateDataForCrawler(){
	data.isValid = true;
	data.article_sys_id = knowledgeRecord.sys_id + '';
	data.kbContentData = kbViewModel.getArticleViewData();//.getArticleContentBySysId(data.article_sys_id);
	data.number = knowledgeRecord.number + '';
	data.articleType = knowledgeRecord.article_type + '';
	data.attachments = kbViewModel.attachments;
	data.shortDesc = knowledgeRecord.short_description.getDisplayValue() + "";
	data.displayAttachments = knowledgeRecord.display_attachments + '';
	data.kbSysId = knowledgeRecord.kb_knowledge_base.sys_id + '';
	data.hasComments = false;
	data.tableName = knowledgeRecord.sys_class_name + '';
}

function populateDataFromKBViewModel(){
	data.isValid = true;
	data.isLoggedInUser = gs.getSession().isLoggedIn();
	data.canContributeToKnowledge = kbViewModel.canContributeToKnowledgeBase; //canContributeHelper.canContribute(kbViewModel.knowledgeRecord);
	data.article_sys_id = knowledgeRecord.sys_id + '';
	data.authorTitle = kbViewModel.authorTitle || kbViewModel.getAuthorInfo("author.title");
	data.kbContentData = kbViewModel.getArticleViewData();
	data.avgRating = Math.round(knowledgeRecord.rating);
	data.number = knowledgeRecord.number + '';
	data.articleType = knowledgeRecord.article_type + '';
	data.permalink = kbViewModel.permalink;
	data.category = knowledgeRecord.category;
	data.attachments = kbViewModel.attachments;
	data.shortDesc = knowledgeRecord.short_description.getDisplayValue() + "";
	data.viewCount = knowledgeRecord.getDisplayValue('sys_view_count');
	data.displayAttachments = knowledgeRecord.display_attachments + '';
	data.tableName = knowledgeRecord.sys_class_name + '';
	data.disableSuggesting = knowledgeRecord.disable_suggesting;
	data.revisionString = kbViewModel.revisionString;
	data.articleTemplate = kbViewModel.articleTemplateName;
	data.isSubscriptionEnabled = kbViewModel.isSubscriptionEnabled;
	data.helpfulContent = kbViewModel.helpfulText;
	if(data.isSubscriptionEnabled === true && !isMESP){
		data.isArticleSubscribed = (new global.ActivitySubscriptionContext().getSubscriptionService().isSubscribed(knowledgeRecord.sys_id).subscriptionId) ? true : false;//kbViewModel.isArticleSubscribed;
		data.isArticleSubscribedAtKB = (new global.ActivitySubscriptionContext().getSubscriptionService().isSubscribed(knowledgeRecord.kb_knowledge_base).subscriptionId) ? true : false;//kbViewModel.isArticleSubsrcibedAtKB;
	}
	else{
		data.isArticleSubscribed = false;
		data.isArticleSubscribedAtKB = false;
	}

	data.kbSysId = knowledgeRecord.kb_knowledge_base.sys_id + '';
	data.kbName = knowledgeRecord.kb_knowledge_base.getDisplayValue() + '';
	data.externalArticle = kbViewModel.externalArticle;
	data.hasComments = !kbViewModel.feedbackEntryInitialDisplay;
	data.isTaskTable = data.params.sysparm_kb_search_table ? kbViewModel.isTaskTable(data.params.sysparm_kb_search_table) : false;
	data.kbDocSysId = kbViewModel.kbDocSysId;
	data.wordOnlineUrl = kbViewModel.wordOnlineUrl;

}

function populateBreadCrumbs(){
	var breadCrumb = kbViewModel.getBreadcrumb();
	data.breadCrumb = [];
	data.breadCrumb.push({label: knowledgeRecord.kb_knowledge_base.title + ' (' + data.messages.KNOWLEDGE_BASE + ')', type: 'kb_knowledge_base', values: {kb_knowledge_base: knowledgeRecord.kb_knowledge_base.sys_id + ''}});
	var ctg = '';
	for(var i = 0; i < breadCrumb.length; i++){
		ctg += breadCrumb[i].name;
		if(i != breadCrumb.length - 1){
			ctg += ' - ';
		}
	}
	if(ctg !== '' && breadCrumb && breadCrumb.length > 0){
		data.breadCrumb.push({label: ctg + '', type: 'kb_category', values: {kb_knowledge_base: breadCrumb[breadCrumb.length - 1].knowledge_base + '', kb_category:  breadCrumb[breadCrumb.length - 1].value + ''}});
	}
}

function handleViewCountIncrement(){
	var incrementedViewCount = new global.KBViewModel().incrementAndReturnKBView(knowledgeRecord);
	if(incrementedViewCount)
		data.viewCount = parseInt(incrementedViewCount);
}

function initGlideWiki(){
	try{
		data.kbWiki = kbViewModel.getWikiContent();
	}
	catch(e){
		data.kbWiki = '';
	}
}

function populateAttachedTasks(){
	data.attachedIncidents = [];
	data.attachedIncidents = kbViewModel.getAttachedTasks();
}

function populateAffectedProducts(){
	data.affectedProducts = [];
	data.affectedProducts = kbViewModel.getAffectedProducts();
}

function populateVersionInfo(){
	data.isVersioningEnabled = kbViewModel.versioningInfo.isEnabled;
	data.versionList = kbViewModel.versioningInfo.history;
	data.version = knowledgeRecord.getDisplayValue('version');
	data.isLatestVersion = !(kbViewModel.versioningInfo.newVersionAvailable === true);
	data.workflowState = (knowledgeRecord.workflow_state != 'published') ? ('(' + knowledgeRecord.workflow_state.getDisplayValue() + ')') : '';
	data.versionInfo = kbViewModel.versioningInfo.versionDisplay;//((kbViewModel.versioningInfo.newVersionAvailable === true) ? 'v' + data.version  : data.messages.LATEST_VERSION);
	data.versionInfoLabel = kbViewModel.versioningInfo.versionDisplayLabel;
	data.showHistory = kbViewModel.versioningInfo.showHistory;
	data.hideFeedbackOptions = kbViewModel.hideFeedbackOptions;
	data.versionWarningMessage = kbViewModel.versioningInfo.warningMessage;
	if(data.versionWarningMessage){
		data.versionWarningMessage = data.versionWarningMessage.replace('kb_view.do?', '?id='+data.params.sysparm_article_view_page_id+'&');
	}
}


function populateContributorInfo(){
	if(!GlidePluginManager.isActive('com.sn_communities')) return;
	if(sn_communities.CommunityKnowledgeHarvest){
		var h = new sn_communities.CommunityKnowledgeHarvest();
		var res = h.getHarvestedContentInfo(''+knowledgeRecord.sys_id);
		if(res && res.status == 200){
			data.hInfo = res.data;
			if(data.hInfo){
				var message = gs.getMessage("Created from the Community by {0}");
				var contributor = data.hInfo.contributor;
				var profile = gs.getMessage('Community user');
				if(contributor){
					profile = contributor.name.length > 0 ? contributor.name : profile;
					if(contributor.userId)
						profile = '<a href="?id=community_user_profile&user='+contributor.userId+'" target="_blank_cm1" >'+profile+'</a>';
				}
				message = message.replace('{0}', profile);
				data.hInfo.profileMessage = message;
			}
		}
	}
}


function getFeedbackReasonValues(){
	data.feedback_reasons=[];
	var kbFbTask = new global.KBFeedbackTask();
	var response = kbFbTask.getReasonValues();
	if(response){
		data.feedback_reasons = new global.JSON().decode(response);
	}
}

function getPageTitle() {

	var title = gs.getMessage("Knowledge Article View");

	if (!gs.nil(data.article_sys_id)) // kb record found
		title = knowledgeRecord.kb_knowledge_base.getDisplayValue() + " - " + data.shortDesc; // kb name - kb short_desc
	else if (!gs.nil(data.params.sysparm_article_view_page_id)) {
		// kb record NOT found - fetching the kb_article_view portal page title
		var kbPage = new GlideRecord('sp_page');
		kbPage.addQuery("id",data.params.sysparm_article_view_page_id+"");
		kbPage.query();
		if(kbPage.next())
			title = kbPage.getValue('title');
	}

	return title;
}

function getMetaTag() {

	var content = '';

	// kb record found
	if (!gs.nil(data.article_sys_id)){
		content = knowledgeRecord.kb_knowledge_base.getDisplayValue() + " - "
			+ knowledgeRecord.kb_category.getDisplayValue() + " - "
			+ knowledgeRecord.meta_description.getDisplayValue();
	}
	return content;
}

function isUserAllowedToViewAs(params){
    return new KBPortalService().isUserAllowedToViewAs(params);
}