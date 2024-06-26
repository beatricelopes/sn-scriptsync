(function($sp, input, options, data) {

	var kbViewModel = new global.KBViewModel();
	if(kbViewModel.checkCrawlerBot())
		return;
	
	data.tsQueryId = $sp.getParameter("sysparm_tsqueryId") || "";
	data.isCommentsStandalone = ($sp.getParameter('id') === 'me_kb_comments');
	data.article_id = $sp.getParameter('sys_kb_id');
	
	
	var kbPortal = new KBPortalService();
	if(!input){
		if(data.isCommentsStandalone){
			kbViewModel.getInfoForSP({
				sysparm_article_view_page_id: 'me_kb_comments',
				sys_kb_id: data.article_id
			});
			var knowledgeRecord = kbViewModel.knowledgeRecord;
			
			data.isValid = kbViewModel.isValid;
			data.showFeedBack = kbViewModel.showKBFeedback;
			data.hideFeedbackOptions = kbViewModel.hideFeedbackOptions;
			data.hasComments = !kbViewModel.feedbackEntryInitialDisplay;
			data.isKBAdmin = kbViewModel.isAdminUser(knowledgeRecord);
			data.isKBOwner = (gs.getUserID() == knowledgeRecord.kb_knowledge_base.owner);
		}

		getSystemProperties();
		data.disabled = false;
		data.maxFiles = options.max_attachment_no >= 0 ?  options.max_attachment_no: 3;
		data.maxFileSize = options.max_attachment_size? options.max_attachment_size: 2;
		data.suffix = $sp.getPortalRecord().getValue('url_suffix');
		data.isLoggedInUser = gs.getSession().isLoggedIn();
		data.user = kbPortal.getUserDetails(gs.getUserID());
		data.user.user_name = gs.getUserName();
		data.maxCommentsToDisplay = gs.getProperty("glide.knowman.feedback.display_threshold", -1);
		data.messages={};
		data.messages.DELETE_COMMENT_MESSAGE = gs.getMessage("Please note that this post has already received some feedback/response. It's not advisable to delete this content now. Are you sure you want to delete?");
		data.messages.SIMPLE_DELETE_COMMENT_MESSAGE = gs.getMessage("Are you sure you want to delete?");
		data.messages.ADD_ATTACHMENTS = gs.getMessage("Add attachments");
		data.messages.ATTACHMENTS = gs.getMessage("Attachments");
		data.messages.ATTACHMENT_MESSAGE = gs.getMessage("Maximum of {0} files allowed. File Types supported are PPT, PPTX, XLS, XLSX, DOC, DOCX, TXT, PDF, PNG, BMP, JPG, JPEG, GIF, ZIP.",data.maxFiles+'');
		data.messages.MAX_FILES_ALLOWED = gs.getMessage("Maximum {0} Files Allowed.", data.maxFiles+'');
		data.messages.FILE_NOT_SUPPORTED = gs.getMessage("File type is not supported.");
		data.messages.MAX_FILE_SIZE =  gs.getMessage("File exceeds the maximum file size ({0}MB).",data.maxFileSize);
		data.messages.COMMENT_DELETED = gs.getMessage("Comment deleted.");
		data.messages.COMMENT_POSTED = gs.getMessage("Comment posted.");
		data.messages.ATTACHMENTS_SCAN = gs.getMessage("Attachment(s) are currently undergoing security scan.");
		data.messages.ATT_SECURITY_WARNING = gs.getMessage("Remove security failed attachment(s) before saving.");
		data.messages.FILL_REQ_FIELDS = gs.getMessage("Error. Please enter comment.");
		data.messages.MIME_EXCEPTION = gs.getMessage("File type not permitted or mime type does not match the file content.");
		data.messages.INVALID_PARENT = gs.getMessage("The comment you are replying to is no longer available. Please refresh the page.");
		data.messages.REMOVE_ATTACHMENT = gs.getMessage("Remove attachment");
    data.messages.LIKE = gs.getMessage("like");
    data.messages.LIKES = gs.getMessage("likes");
    data.messages.SHOW_REPLIES = gs.getMessage('Show Replies Collapsed');
    data.messages.HIDE_REPLIES = gs.getMessage('Hide Replies Expanded');
    if(data.isCommentsStandalone){
			data.messages.ADD_COMMENT = gs.getMessage("Add a comment (mandatory)");
			data.messages.COMMENTS = gs.getMessage('Comments');
			data.messages.CANCEL = gs.getMessage("Cancel");
			data.messages.SUBMIT = gs.getMessage('Submit');
			data.messages.JUST_NOW = gs.getMessage("just now");
			data.messages.ATTACHMENTS = gs.getMessage('Attachments');
			data.messages.RATE_LIMIT_REACHED = gs.getMessage("You have reached the daily limit for comments posted by a user.");
		}
	}

	if(input){

		var action = input.action;
		if (action === 'get_root_comments'){
			data.response = kbPortal.getRootComments(input.article_id);
		}
		else if (action === 'get_all_comments'){
			data.response = kbPortal.getAllComments(input.article_id);
		}
		else if (action === 'add_comment'){
			data.response = kbPortal.addComment(input.comment_text, input.article_id, "");
		}
		else if (action === 'submit_rating'){
			data.response = kbPortal.submitRating(input.rating, input.article_id);
		}
		else if (action === 'delete_comment'){
			data.response =  kbPortal.deleteComment(input.feedback_id, input.article_id);
		}
		else if (action === 'reply_comment'){
			data.response = kbPortal.addComment(input.comment_text, input.article_id, input.parent_id);
		}
		else if(action === 'like_comment'){
			data.response = kbPortal.likeComment(input.feedback_id, input.article_id);
		}
		else if(action === 'unlike_comment'){
			data.response = kbPortal.unLikeComment(input.feedback_id, input.article_id);
		}
		else if(action == "get_user_details"){
			data.response = kbPortal.getUserDetails(input.sys_id);
		}
		else if(action == "get_showflaggedcomments_flag"){
			data.response = kbViewModel.showFlaggedComments(input.article_id);
		}
	}

	function getSystemProperties(){
		data.rating_threshold = gs.getProperty('glide.knowman.feedback.enable_actionable_feedback_for_rating',"");
	}


})($sp, input, options, data);