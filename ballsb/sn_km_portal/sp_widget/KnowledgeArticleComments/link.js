function(scope) {
	var c = scope.c,
			$uibModal = $injector.get('$uibModal'),
			$timeout = $injector.get('$timeout'),
			$rootScope = $injector.get("$rootScope"),
			$http = $injector.get("$http"),
			$sanitize = $injector.get("$sanitize"),
			$interval = $injector.get("$interval");

	$timeout(function(){

		$(".inner-html-content").find("img").attr("tabindex","0");
		var timer = 0;
		var prevent = false;
		var element;


		$(".kb-comment-wrapper").on("click keypress",".inner-html-content img", function() {
			element = this;
			var parentTag = $(this).parent().get(0).tagName;
			if(parentTag!='A')
			{
			timer = $timeout(function() {
				if (!prevent)
					openModal(element);
				prevent=false;
			}, 200);
			}
		});

		$(".kb-comment-wrapper").on("dblclick",".inner-html-content img", function() {
			element = this;
			prevent = true;
			clearTimeout(timer);
			openModal(element);
		});



	});

	function openModal(element){
		var pageRoot = angular.element('.sp-page-root');
		var options = {
			scope: scope,
			keyboard: true,
			templateUrl: 'kmImageModal',
			windowClass: 'image-modal-dialog'
		};
		if( c.commentsImage == '' ||  c.commentsImage.closed.$$state.status == 1 ){
			var src= element.src;
			c.instance = $uibModal.open(options);
			c.instance.rendered.then(function() {
				//hide the root page headings when modal is active
				pageRoot.attr('aria-hidden', 'true');
			});
			c.instance.closed.then(function() {
				pageRoot.attr('aria-hidden', 'false');
			});
			var orignalWidth = $(element).prop('naturalWidth');
			var orignalHeight = $(element).prop('naturalHeight');
			$timeout(function(){
				var modal = document.getElementById('knowledgeImageModal'),
						modalImg = $('#modalImage')[0];
				modal.style.display = "block";
				modalImg.src = src;
				c.imagesrc = src;
				modalImg.width = orignalWidth > c.minImageWidth ? orignalWidth : c.minImageWidth;
				modalImg.style.minHeight = orignalHeight > c.minImageHeight ? orignalHeight : c.minImageHeight +"px";
				$('.modal-dialog').width(modalImg.width);
				$('#modal-close').focus();

			});
		}
	}



	//temp init
	c.config = {};
	c.config.showDialogDnD = true;


	c.openModal = function(options, focusElementOnOpen, focusElementOnClose){
		var pageRoot = angular.element('.sp-page-root');
		c.instance = $uibModal.open(options);
		c.instance.rendered.then(function() {
			//hide the root page headings when modal is active
	    pageRoot.attr('aria-hidden', 'true');
	    if (focusElementOnOpen)
                $("#" + focusElementOnOpen).focus();
		});
		c.instance.closed.then(function() {
			pageRoot.attr('aria-hidden', 'false');
			if (focusElementOnClose)
                $("#" + focusElementOnClose).focus();
		});
	}

	c.runMe = function(){
		if(c.comments.length > 0) c.latestComment = c.comments[0];
		for(var i=0;i<c.comments.length;i++){
			makeCircularJSON(c.comments[i],{},c.comments[i],0);
		}
	}

	if($rootScope.hasComments && c.maxCommentsToDisplay != 0 && c.showComments && $rootScope.isValid){
		c.server.get({action : 'get_root_comments', article_id: $rootScope.article_sys_id}).then(function(r){
			if(r.data.response.length>0){
				c.comments = r.data.response;
				if(c.maxCommentsToDisplay == -1)
					c.maxCommentsToDisplay = c.comments.length;

				if(c.comments.length > c.maxCommentsToDisplay){
					c.commentsToDisplay = c.maxCommentsToDisplay;
					c.hasMoreComments = true;
				} else{
					c.commentsToDisplay = c.comments.length;
					c.hasMoreComments = false;
				}
				fetchAllComments();
			}
		});
	}

	function fetchAllComments(){
		c.server.get({action : 'get_all_comments', article_id:  $rootScope.article_sys_id}).then(function(r){
			if(r.data.response.length > 0){
				for(var i=0;i<r.data.response.length;i++){
					var index = c.findIndex(c.comments,"sys_id",r.data.response[i].root_id);
					if(index != -1){
						c.comments[index].children = r.data.response[i].children;
						c.comments[index].has_children = true;
						c.comments[index].show_replies = false;
					}
				}
			}
			c.runMe();
		});
	}



	function makeCircularJSON(comment,parent,root,level){
		comment.parent_obj = parent;
		comment.root = root;
		comment.level = level;
		comment.is_liked = c.isLikedByUser(comment.likes);
		if( c.latestComment.created_on < comment.created_on ) c.latestComment = comment;
		for(var i=0;i<comment.children.length;i++){
			makeCircularJSON(comment.children[i],comment,root,level+1);
		}
	}

	c.showMoreComments = function(){
		var nextCommentFocusIdx = c.commentsToDisplay;
		if(c.commentsToDisplay + c.maxCommentsToDisplay >= c.comments.length){
			c.commentsToDisplay = c.comments.length;
		}
		else{
			c.commentsToDisplay += c.maxCommentsToDisplay;
		}
		c.nextCommentFocus(c.comments[nextCommentFocusIdx].sys_id);
	}

	c.getTotalAttachments = function(feedback){
		return c.selectedFiles.length ;
	}

	function clearAttachments(){
		c.selectedFiles = [];
	}


	c.showReplyBox = function(feedback){
		c.closeAllEditors();
		c.showMobCommentBox = false;
		c.currentEditorComment = feedback;
		c.currentEditorId = feedback.sys_id;
		clearAttachments();
		if(!c.isMobile)	
			c.focusEditor();
		else {
			$timeout(function(){
				$("#comment").focus();
			});
		}
	}


	//This returns true if there is a path from child comment to parent comment else returns false
	c.isParentComment = function(parent,child) {
		if (jQuery.isEmptyObject(child))
			return false;
		if (child.sys_id == parent.sys_id)
			return true;
		while (!jQuery.isEmptyObject(child.parent_obj)) {
			child = child.parent_obj;
			if (child.sys_id == parent.sys_id)
				return true;
		}
		return false;
	}

	c.showDeleteBox = function(feedback){

		c.currentComment = feedback;
		if(feedback.has_children){
			c.modalMessage = c.messages.DELETE_COMMENT_MESSAGE + "";

		}else{
			c.modalMessage = c.messages.SIMPLE_DELETE_COMMENT_MESSAGE + "";

		}

		if(c.isMobile){
			var usrDelInput = confirm(c.modalMessage);
			if(usrDelInput)
				{
					//checks whether any parent comment to current editor is deleted
					if(c.isParentComment(feedback,c.currentEditorComment))
						c.closeAllEditors();
					c.deleteComment(c.currentComment);
        }
		}else{
			c.modalType = "delete";
			var options = {
				scope: scope,
				backdrop: 'static',
				keyboard: true,
				templateUrl: 'kmDeleteModal',
				windowClass: 'delete-modal-dialog'
			};
			c.openModal(options);
		}
	}


	c.openAttachmentsModal = function(){

		var pageRoot = angular.element('.sp-page-root');
		c.closeErrorMessage();
		c.tempSelectedFiles=[];
		var options = {
			scope: scope,
			keyboard: true,
			templateUrl: 'kmAttachmentsEditor',
			windowClass: 'attachments-modal-dialog',
			keyboard: scope.options.keyboard != undefined ? scope.options.keyboard : true,
		    	controller : function($scope, $uibModalInstance){
			$scope.instance = scope.data.instance;
			$scope.$on('modal.closing', function() {
				pageRoot.attr('aria-hidden', 'false');
			});
		}
		};
		c.openModal(options, "attachment_body", "attachments_button");
	}

	c.openLikesModal = function(feedback){
		if(!c.isMobile){
			var options = {
				size:"sm",
				scope: scope,
				keyboard: true,
				templateUrl: 'kmLikesModal',
				windowClass: 'likes-modal-dialog'
			};

			c.likes = feedback.likes;
			c.openModal(options);
		}
	}



	c.closeModal = function(){

		if(c.instance){
			c.instance.close();
			c.instance = '';
		}

	}


	c.showMainCommentBoxFn = function(){
		c.closeAllEditors();
		clearAttachments();
		c.showMainCommentBox = true;
		if(!c.isMobile)	
			c.focusEditor();
	}



	c.openAttachmentsList = function(attachments){
		var options = {
			size:"md",
			scope: scope,
			keyboard: true,
			templateUrl: 'kmAttachmentsList',
			windowClass: c.isMobile ? 'attachments-list-modal-dialog' : 'attachments-list-modal-dialog kb-desktop'
		};
		c.attachmentsList = attachments;
		c.openModal(options);
	}



	c.toggleAllComments = function(){

		c.showAllComments = !c.showAllComments;
		if(c.showAllComments){
			c.comments.forEach(function(cm){
				showReply(cm,true);

			});
		}else{
			c.comments.forEach(function(cm){
				showReply(cm,false);
			});
		}

	}

	function showReply(feedback,value){
		if(feedback.hasOwnProperty("show_replies")){
			feedback.show_replies = value;
		}
	}

	c.toggleReply = function(feedback){
		feedback.show_replies = !feedback.show_replies;
		if(c.isMESP){
			if(feedback.show_replies && c.isLoggedInUser){
			$timeout(function(){
				$('.visible-xs #deleterec_'+feedback.children[0].sys_id).focus();
			});
			}
			else
				$timeout(function(){$('#replies_'+feedback.sys_id).focus();});
		}
	}


	c.showReply = function(feedback){

		if(feedback.level == 0){
			if(feedback.show_replies == true)
				return true;
			return false;
		}
		return true;
	}

	c.focusEditor = function(){	
		if(!c.isMESP){	
			var counter = 0,	
					duration = 100,	
					focusEditorInterval = $interval(function(){	
						counter += duration;	
						if(tinyMCE.activeEditor && tinymce.activeEditor.getBody() !=null){	
							tinyMCE.activeEditor.focus();	
							$interval.cancel(focusEditorInterval);	
						}	
						else if(counter > 5000){	
							$interval.cancel(focusEditorInterval); //kill it after 1/2 a minute	
						}	
					},duration);	
		}	
	}
	
	c.closeAllEditors = function(param,id){
		c.commentText = "";
		c.currentEditorId = "";
		c.currentEditorComment = {};
		c.showMainCommentBox = c.isMobile && c.isMESP;
		c.showMobCommentBox = true;
		/*Give focus to the editor*/
		if(param)
			if(param=='comment')
				$timeout(function(){$('.kb-comment-wrapper .create-comment .inline button').focus()},0);
			/*give focus to the show reply button*/
			else if(param=='reply')
				$timeout(function(){$('#reply_'+id).focus()},0);
	}


	c.getClass = function(feedback,index,last){

		var classes;
		var level = feedback.level;
		if(level > c.maxLevel) classes = "noPaddingChild";
		else if(level == c.maxLevel) classes = "maxChild";
		else if(level%2 == 0) classes = "evenChild";
		else classes = "oddChild";

		if(last){

			var parent = feedback.parent_obj;
			if(parent.parent != "" ){
				var super_parent = parent.parent_obj;
				var parent_index = c.findIndex(super_parent.children,"sys_id",parent.sys_id);
				if(parent_index+1 < super_parent.children.length)
					classes += " addBorderBottom";
			}
		}

		if(index != 0){
			if(feedback.parent_obj.children[index-1].children.length > 0) classes += " removeBorderTop";
		}

		return classes;
	}

	c.getMenuItems = function(feedback){
		if(c.isLoggedInUser){
			if((feedback.user.sys_id == c.user.sys_id) || $rootScope.isKBAdmin || $rootScope.isKBOwner) {
				return true;
			}
		}
		return false;
	}

	c.isLikedByUser = function(likes){
		for(var i=0;i<likes.length;i++){
			if(likes[i].user.sys_id == c.user.sys_id) return true;
		}
		return false;
	}

	c.findIndex = function(arr,attr,val){
		var res = -1;
		for (var i = 0; i < arr.length ; i++) {
			if(arr[i][attr] == val) {
				res = i;
				break;
			}
		}
		return res;
	}
	
	c.nextCommentFocus = function(id){
		if(!c.isMESP)
			$timeout(function(){$('#comment_'+id+' .author a:first-child').focus()},0);
		else
			$timeout(function(){$("#deleterec_" + id).focus();});
	}
	
	c.submitComment = function(){
		var cmtText = c.isMESP ? c.commentText : tinyMCE.activeEditor.getContent().toString();
		if(!cmtText || cmtText.length == 0 || cmtText.replace(/<p>|&nbsp;|<\/p>|<br>|<br\/>|<br\ \/>/ig, '').trim().length == 0){
			c.type = "error";
			c.data.response = c.messages.FILL_REQ_FIELDS;
			return ;
		}


		//if textarea is used, convert "\n" to "<br>"
		if(c.isMESP){
			cmtText = $sanitize(cmtText.replace(new RegExp('\r?\n','g'), '<br />'));
		}

		c.closeAllEditors();
		c.server.get({action : 'add_comment', comment_text : cmtText, article_id : $rootScope.article_sys_id, level:0}).then(function(r){
			if(r.data.response.sys_id){

				var newComment = r.data.response;
				newComment.parent_obj = {};
				newComment.root = newComment;
				newComment.level = 0;
				newComment.is_liked = false;
				if(!c.isMobile)
					c.uploadAttachments(c.selectedFiles, newComment);
				c.comments.unshift(newComment);
				c.commentsToDisplay++;

				if(c.selectedFiles.length == 0){
					c.type = true;
					c.data.response = c.messages.COMMENT_POSTED;
				}
				c.latestComment = newComment;

				c.justNow = true;
				$timeout(function(){
					c.justNow = false;
				},30000);
				c.nextCommentFocus(newComment.sys_id);
			}
			else {
				c.type = "error";
				c.data.response = $rootScope.messages.RATE_LIMIT_REACHED;
			}

			clearAttachments();

		});
	}




	c.replyToComment = function(feedback){

		var cmtText = c.isMESP ? c.commentText : tinyMCE.activeEditor.getContent();

		if(!cmtText || cmtText.length == 0 || cmtText.replace(/<p>|&nbsp;|<\/p>|<br>|<br\/>|<br\ \/>/ig, '').trim().length == 0){
			c.type = "error";
			c.data.response = c.messages.FILL_REQ_FIELDS;
			return ;
		}

		//if textarea is used, convert "\n" to "<br>"
		if(c.isMESP){
			cmtText = $sanitize(cmtText.replace(new RegExp('\r?\n','g'), '<br />'));
		}

		c.closeAllEditors();
		c.server.get({action : 'reply_comment', comment_text : cmtText, article_id : $rootScope.article_sys_id, parent_id : feedback.sys_id}).then(function(r){

			if(r.data.response.sys_id){
				var newComment = r.data.response;
				newComment.parent_obj = feedback;
				newComment.root = feedback.root;
				newComment.is_liked = false;
				newComment.level = parseInt(feedback.level)+1;
				feedback.root.has_children = true;
				if(!c.isMobile)
					c.uploadAttachments(c.selectedFiles, newComment);
				feedback.children.unshift(newComment);
				newComment.root.show_replies = true;
				c.commentsToDisplay++;
				if(c.selectedFiles.length == 0){
					c.type = true;
					c.data.response = c.messages.COMMENT_POSTED;
				}
				c.latestComment = newComment;
				c.justNow = true;
				$timeout(function(){
					c.justNow = false;
				},30000);
				c.nextCommentFocus(newComment.sys_id);
			}
			else {
				c.type = "error";
				if(r.data.response == "INVALID_PARENT"){
					c.data.response = c.messages.INVALID_PARENT;
				}else{
					c.data.response = $rootScope.messages.RATE_LIMIT_REACHED;
				}

			}


		});
	}



	c.deleteComment = function(feedback){
		if(!c.isMobile)
			c.closeModal();
		c.server.get({action : 'delete_comment', feedback_id : feedback.sys_id, article_id : $rootScope.article_sys_id}).then(function(r){
			if(r.data.response){
				c.type = true;
				c.data.response = c.messages.COMMENT_DELETED;
				var index;
				if(feedback.level == 0){
					index = c.findIndex(c.comments,"sys_id",feedback.sys_id);
					if(index != -1)
						c.comments.splice(index,1);
					/*No comments, give focus to the button(click to edit)*/
					if(c.comments.length==0) {
						if(!c.isMESP)
							$timeout(function(){$('.kb-comment-wrapper .create-comment .inline button').focus()},0);
						else
							$timeout(function(){$("#comment").focus();});
					}
					/*Give focus to the next comment*/
					else if(index<=c.comments.length-1)
						c.nextCommentFocus(c.comments[index].sys_id);
					/*If no next element, give focus to last comment*/
					else if(index>c.comments.length-1)
						c.nextCommentFocus(c.comments[index-1].sys_id);
				}else{
					index = c.findIndex(feedback.parent_obj.children,"sys_id",feedback.sys_id);
					if(index != -1){
						feedback.parent_obj.children.splice(index,1);
						if(feedback.root.children.length == 0){
							feedback.root.has_children = false;
							feedback.show_replies = false;
							/*No children exists for feedback; focus the root comment*/
							c.nextCommentFocus(feedback.root.sys_id);
						}else{
							/*No children exists for the comment, focus parent comment*/
							if(feedback.parent_obj.children.length==0)
								c.nextCommentFocus(feedback.parent_obj.sys_id);
							/*If children exists and next comment exists, focus */
							else if(index<=feedback.parent_obj.children.length-1)
								c.nextCommentFocus(feedback.parent_obj.children[index].sys_id);
							/*If children exists and no next comment exists, focus last children*/
							else if(index>feedback.parent_obj.children.length-1)
								c.nextCommentFocus(feedback.parent_obj.children[index-1].sys_id);
						}
					}
				}
        c.runMe();
			}
		});
	}

	c.likeComment = function(feedback){
		if(c.isLoggedInUser){
			if(feedback.is_liked){
				c.server.get({action : 'unlike_comment', feedback_id: feedback.sys_id, article_id: $rootScope.article_sys_id}).then(function(r){
					if(r.data.response){
						for(var i=0;i<feedback.likes.length;i++){
							if(feedback.likes[i].user.sys_id == c.user.sys_id){
								feedback.likes.splice(i,1);
								break;
							}
						}
						feedback.is_liked = false;
					}
				});
			}
			else{
				c.server.get({action : 'like_comment', feedback_id: feedback.sys_id, article_id: $rootScope.article_sys_id}).then(function(r){
					if(r.data.response.sys_id){
						feedback.likes.push(r.data.response);
						feedback.is_liked = true;
					}
				});
			}

		}
	}



	//attachments


	c.uploadAttachments = function(files,comment){

		if(files.length > 0 ){
			var options = {
				scope: scope,
				keyboard: false,
				templateUrl: 'kmAttachmentsProgress',
				windowClass: 'attachments-progress-dialog',
				backdrop: false
			};
			c.openModal(options);
		}

		var success=0, error=0;
		for(var i=0;i<files.length;i++){

			var request = {
				method: 'POST',
				url: '/api/now/v1/attachment_csm/file?table_name=kb_feedback&table_sys_id='+comment.sys_id+'&file_name='+files[i].name,
				data: files[i],
				headers: {
					'Content-Type': files[i].type,
					'Accept':'application/json'
				}
			};

			// SEND THE FILES.
			$http(request)
				.success(function (d) {
				comment.attachments.push({
					file_name:d.result.file_name,
					size:d.result.size_bytes,
					state:d.result.state,
					sys_id:d.result.sys_id,
					type:d.result.content_type
				})
				c.uploadCompleted(files.length ,++success, error);

			})
				.error(function (err) {
				c.data.response = c.messages.MIME_EXCEPTION;
				c.type = "error";
				c.uploadCompleted(files.length,success,++error);
			});
		}
	}

	c.uploadCompleted = function(filesLength, success, error){
		if(filesLength == success + error){
			clearAttachments();
			$timeout(function(){
				c.closeModal();
				c.type = true;
				if(filesLength != error)
					c.data.response = c.messages.COMMENT_POSTED+" "+c.messages.ATTACHMENTS_SCAN;
				else
					c.data.response = c.messages.COMMENT_POSTED;
			},100);
		}
	}




	c.cancelAttachments = function(){
		c.tempSelectedFiles=[];
		c.closeModal();
	}

	c.filesSelected = function(files){
		var i;

		if((files.length + c.selectedFiles.length + c.tempSelectedFiles.length) > c.maxFiles){
			c.showErrorMessage(c.messages.MAX_FILES_ALLOWED,"danger");
		}
		else{
			for( i=0;i<files.length;i++)
				if(c.validateFile(files[i]))
					c.tempSelectedFiles.push(files[i]);
		}
	}
	c.saveFiles = function(){
		if(c.tempSelectedFiles.length > 0)
			c.selectedFiles = c.selectedFiles.concat(c.tempSelectedFiles);
		c.closeModal();
	}

	c.validateFile = function(file){

		var currentFileExtension = file.name.substr((~-file.name.lastIndexOf(".") >>> 0) + 2);// file.name.substr(file.name.lastIndexOf('.') + 1);
		if(c.validExtensions.indexOf(currentFileExtension.toUpperCase()) == -1){
			c.showErrorMessage(c.messages.FILE_NOT_SUPPORTED,"danger");
			return false;
		}

		if(file.size/1024 > c.maxFileSize*1024){
			c.showErrorMessage(c.messages.MAX_FILE_SIZE,"danger");
			return false;
		}

		return true;

	}


	c.moreFilesAllowed = function(){
		if(c.selectedFiles.length >= c.maxFiles)
			return false;
		return true;
	}

	c.removeFile = function(index){
		c.selectedFiles.splice(index,1);
	}
	
	c.removeTempFile = function(index){
		c.tempSelectedFiles.splice(index,1);
	}


	c.openSelector = function(event){
		jQuery('#fileinput').click();
	}

	c.showErrorMsg = false;
	c.errorMessage = '';

	c.closeErrorMessage = function(){
		c.showErrorMsg = false;
		c.errorMessage = '';
	};

	c.showErrorMessage = function(message, notificaionType){
		c.showErrorMsg = true;
		c.errorMessage = message;
		c.messageType = 'danger';
		if(notificaionType)
			c.messageType = notificaionType;
		//$timeout(function(){c.closeErrorMessage();}, 7500);
		if (c.messageType != 'info')
			$timeout(function(){
				$('#error_close').focus();
			});
	};

	c.downloadFile = function(file){
		var url = '/sys_attachment.do?sys_id=' + file.sys_id;
		// Multi download will fail with window.location.href for slow network connections, so using iframe.
		var ifrm = document.createElement("iframe");
		ifrm.setAttribute("src", url);
		ifrm.style.display = "none";
		document.body.appendChild(ifrm);
		$timeout(function(){
			document.body.removeChild(ifrm);
		}, 60000);
	}

	c.downloadAll = function(files){
		for(var i=0; i<files.length;i++){
			if(files[i].state != 'not_available')
				c.downloadFile(files[i]);
		}
	}

	c.renderMentions = function(comment_text) {
		return $sanitize(comment_text.replace(/@\[([a-z0-9]{32}):([^:\[\]]+)\]/g, "@$2"));
	}

	function getShowFlaggedCommentsFlag(){
		
		c.server.get({action : 'get_showflaggedcomments_flag', article_id:  $rootScope.article_sys_id}).then(function(r){
							c.showFlaggedComments = r.data.response;
							c.initializeRecordWatcher();
							
					});
	}
	getShowFlaggedCommentsFlag();
	
	

	$timeout(function(){
		c.isLoading = false;
	},2000);
}