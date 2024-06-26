(function() {
	//set instance sys_id to be used as unique id for collapse
	data.instanceid = $sp.getDisplayValue('sys_id');
	options.dynamic = options.dynamic ? options.dynamic == 'true' : false;
	options.alt_url_params = options.alt_url_params || "";
	data.socialqa_enabled = false;
	data.messages = {};
  //aria labels
	data.messages.FILTER_LABEL = gs.getMessage("Filter");
	data.messages.OPTIONS_LABEL = gs.getMessage("options");
	data.messages.CLEAR_LABEL = gs.getMessage("Clear");
	data.messages.Knowledge = gs.getMessage("Articles");
	data.messages.Social = gs.getMessage("Social Q&A");
	data.messages.Answered = gs.getMessage("Answered");
	data.messages.Unanswered = gs.getMessage("Unanswered");

	if(isSocialQAEnabled())
		data.socialqa_enabled = true;

	function isSocialQAEnabled(){
		if (!GlidePluginManager().isActive('com.snc.knowledge.social_qa.ui'))
			return false;

		if(!new global.GlobalKnowledgeUtil().canCreateNewQuestion())
			return false;

		return true;
	}
})();