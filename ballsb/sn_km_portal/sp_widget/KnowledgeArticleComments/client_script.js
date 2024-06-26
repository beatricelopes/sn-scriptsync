function ($rootScope, $scope, spUtil,$http, $timeout,spModal,$uibModal,cabrillo,$sanitize, $interval) {
	var c = this;
	var newCommentParent={};
	if(c.data.isCommentsStandalone){
		$rootScope.properties = {
			showFeedBack: c.data.showFeedBack
		};
		$rootScope.isValid = c.data.isValid;
		$rootScope.article_sys_id = c.data.article_id;
		$rootScope.hideFeedbackOptions = c.data.hideFeedbackOptions;
		$rootScope.readOnly = false;
		$rootScope.messages = c.data.messages;
		$rootScope.hasComments = c.data.hasComments;
		$rootScope.isKBAdmin = c.data.isKBAdmin;
		$rootScope.isKBOwner = c.data.isKBOwner;
	}
	c.isMobile = spUtil.isMobile() || cabrillo.isNative();
	c.isMESP = $rootScope.portal ? ($rootScope.portal.sys_id == "26f2fffb77322300454792718a1061e5") : false;
	c.isNative = cabrillo.isNative();
	c.isValid = $rootScope.isValid;
	c.showComments = false;
	c.currentEditorId = '';
	c.currentEditorComment = {};
	c.maxFiles = c.data.maxFiles;
	c.showAllComments = false;
	c.selectedFiles = [];
	c.showMainCommentBox = c.isMobile && c.isMESP;
	c.showMobCommentBox = true;
	c.isLoggedInUser = c.data.isLoggedInUser;
	c.user = c.data.user;
	c.isLoading = true;
	c.showComments = c.options.show_user_comments === 'Use system properties' ? ($rootScope.properties && $rootScope.properties.showFeedBack) : c.options.show_user_comments === 'Yes';
	c.commentsPrompt = c.options.add_comment_prompt ? c.options.add_comment_prompt : $rootScope.messages.ADD_COMMENT;
	c.rateStyle = (c.showComments) ? 'pull-right' : 'kb-rate-mobile';
	c.commentsImage = '';
	c.minImageHeight = 100;
	c.minImageWidth =  185;
	c.validExtensions = ("PPT,PPTX,XLS,XLSX,DOC,DOCX,TXT,PDF,PNG,BMP,JPG,JPEG,GIF,ZIP").toUpperCase().split(',');
	c.maxFileSize = c.data.maxFileSize;
	c.maxLevel = c.isMobile ? 3 : 7;
	c.latestComment = "";
	c.commentText = "";
	c.instance = '';
	c.data.response = "";
	c.suffix = c.data.suffix;
	c.messages = c.data.messages;
	c.commentsField = {"sys_mandatory":false,"visible":true,"color":"transparent","dbType":-1,"label":"Comments","sys_readonly":false,"type":"string","mandatory":false,"displayValue":"","readonly":false,"hint":"","name":"comments","attributes":{"edge_encryption_enabled":"true"},"choice":0,"value":"","max_length":4000,"ed":{"name":"comments"},"originalValue":""};
	c.comments = [];
	c.maxCommentsToDisplay = isNaN(c.data.maxCommentsToDisplay) ? 0 : parseInt(c.data.maxCommentsToDisplay);
	c.commentsToDisplay = 0;
	c.hasMoreComments = false;
	c.justNow = false;
	c.direction = g_text_direction;

	c.initializeRecordWatcher = function() {
	if(c.showComments && c.isLoggedInUser){

	        var withFlagged = "commentsISNOTEMPTY^flagged=false^ratingISEMPTY^useful=^article=" + $rootScope.article_sys_id + "^user!=" + c.user.sys_id + "^NQcommentsISNOTEMPTY^flagged=true^article=" + $rootScope.article_sys_id;
	        var withoutFlagged = "commentsISNOTEMPTY^flagged=false^ratingISEMPTY^useful=^article=" + $rootScope.article_sys_id + "^user!=" + c.user.sys_id;
	
	        spUtil.recordWatch($scope, "kb_feedback", c.showFlaggedComments ? withFlagged : withoutFlagged, function(name, data) {

	            if (name.data.operation == "insert") {

				var record = name.data.record;
	
	                if (record.flagged.value == "false" || (record.flagged.value == "true" && (c.showFlaggedComments || c.user.sys_id == record.user.value))) {
	
					var commentRecord = {
						children:[],
						created_on : record.sys_created_on.value,
						comment_text : record.comments.value,
						just_now : 'Y',
						attachments : [],
						sys_id : name.data.sys_id,
						likes:[],
						is_liked:false,
						has_children: false,
						user:{
							name: record.user.display_value,
							sys_id: record.user.value
						}
					};

	                    c.server.get({
	                        action: 'get_user_details',
	                        sys_id: record.user.value
	                    }).then(function(r) {
						if(r.data.response){
							commentRecord.user = r.data.response;
						}
					});

					if(record.hasOwnProperty("parent_comment"))
						commentRecord.parent = record.parent_comment.value;
					else
						commentRecord.parent = "";

					if(commentRecord.parent){ //nested Comment
						if(getParentComment(c.comments,commentRecord.parent)){
							commentRecord.parent_obj = newCommentParent;
							commentRecord.level = newCommentParent.level + 1;
							newCommentParent.children.unshift(commentRecord);
							commentRecord.root = newCommentParent.root;
							commentRecord.root.show_replies = true;
							newCommentParent.has_children = true;
							c.latestComment = commentRecord;
						}
	                    } else {
						commentRecord.level = 0;
						commentRecord.show_replies = true;
						commentRecord.parent_obj = {};
						commentRecord.root = commentRecord;
						c.latestComment = commentRecord;
						c.comments.unshift(commentRecord);
						c.commentsToDisplay++;
					}
					c.justNow = true;
					$timeout(function(){
						c.justNow = false;
					},30000);

				}

	            }
	

				if(name.data.operation == "delete"){

					var index,sys_id = name.data.sys_id;
					if(getParentComment(c.comments,sys_id )){

						if(newCommentParent.parent == ""){
							index = c.findIndex(c.comments,"sys_id",sys_id);
							if(index != -1)
							c.comments.splice(index,1);
						}else{
							if(getParentComment(c.comments,newCommentParent.parent)){
							index = c.findIndex(newCommentParent.children,"sys_id",sys_id);
								if(index != -1){
							newCommentParent.children.splice(index,1);
							if(newCommentParent.root.children.length == 0){
								newCommentParent.root.has_children = false;
								newCommentParent.root.show_replies = false;
							}
						}
							}
						}
					}
          c.runMe();
				}

		});
	}
	}

	c.hasCommentText = function(){
		if(!c.isLoading && ((!c.isMESP && tinyMCE.activeEditor.getContent().toString())) || (c.isMESP && c.commentText)){
			return true;
		}
		return false;
	}

	function getParentComment(cmArray, parentId){
		newCommentParent = {};
		for(var i=0; i < cmArray.length; i++){
			if(cmArray[i] && cmArray[i].sys_id == parentId ){
				newCommentParent =  cmArray[i];
				return true;
			}
			else {
				if(cmArray[i].children.length)
					getParentComment(cmArray[i].children, parentId);
				if(newCommentParent.hasOwnProperty("sys_id"))
					return true;
			}
		}

		return false;
	}

	$scope.$watch("c.data.response", function(){
		if(c.data.response != ''){
			if(cabrillo.isNative())
				cabrillo.message.showMessage(c.type != 'error' ? cabrillo.message.SUCCESS_MESSAGE_STYLE : cabrillo.message.ERROR_MESSAGE_STYLE, c.data.response);
				else
					$scope.$emit('$$uiNotification', {
						"message": c.data.response,
						"type": c.type});
		}
		c.clearMessage();
	});

	c.updateCommentFromInput = function(event){
		c.commentText = event.target.value;
	}
	c.clearMessage = function(){
		$timeout(function() {
			c.data.response = "";
		}, 500);
	};

	c.hasChildren = function(){
		for(var i=0;i<c.comments.length;i++){
			if(c.comments[i].has_children) return true;
		}
		return false;
	}
  c.getLabelForLikes = function(likes) {
    if(likes == 1)
      return likes + " " + c.data.messages.LIKE;
    else
      return likes + " " + c.data.messages.LIKES;
  }

}