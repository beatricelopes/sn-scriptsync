function(scope,$timeout) {
	var c = scope.c,
			$uibModal = $injector.get('$uibModal'),
			$rootScope = $injector.get("$rootScope");
	var options = {
		scope: scope,
		keyboard: true,
		templateUrl: 'knowledge-image-modal.html'
	};
	setTimeout(function(){
		var p=$(".kb-article-content").find("img");
		p.attr("tabindex","0");
		p.attr("role","button");
		var timer = 0;
		var prevent = false;
		var element;

		$(".kb-article-content").on("click keypress","img", function() {
			element = this;
			var parentTag = $(this).parent().get(0).tagName;
			if(parentTag!='A')
			{
			timer = setTimeout(function() {
				if (!prevent)
					openModal(element);
				prevent=false;
			}, 200);
			}
		});

		$(".kb-article-content").on("dblclick","img", function() {
			element = this;
			prevent = true;
			clearTimeout(timer);
			openModal(element);
		});

	});

	function openModal(element){
		if( c.imageInstance == '' ||  c.imageInstance.closed.$$state.status == 1 ){
			var pageRoot = angular.element('.sp-page-root');
			var src= element.src;
			var title=element.title;
			var alt=element.alt;
			c.imageInstance = $uibModal.open(options);
			c.imageInstance.rendered.then(function() {
				//hide the root page headings when modal is active
				pageRoot.attr('aria-hidden', 'true');
				$('#modal-close').focus();
			});
			c.imageInstance.closed.then(function(){
				pageRoot.attr('aria-hidden', 'false');
			});
			var orignalWidth = $(element).prop('naturalWidth');
			var orignalHeight = $(element).prop('naturalHeight');
			setTimeout(function(){
				var modal = document.getElementById('knowledgeImageModal'),
						modalImg = $('#modalImage')[0];
				modal.style.display = "block";
				modalImg.src = src;
				modalImg.title = title;
				modalImg.alt = alt;
				c.imagesrc = src;
				modalImg.width = orignalWidth > c.minImageWidth ? orignalWidth : c.minImageWidth;
				modalImg.style.minHeight = orignalHeight > c.minImageHeight ? orignalHeight : c.minImageHeight +"px";
				$('.modal-dialog').width(modalImg.width);
				$('#modal-close').focus();

			});
		}
	}

	c.showAttachArticle = function(){
		try{
			if(window.opener && window.opener.document.getElementById("section_form_id") != null && c.data.params.sysparm_kb_search_table && c.data.isTaskTable){
				$('.kb_container-left').removeClass('col-md-9').addClass('col-md-12');
				if(c.data.displayAttachments == 'true' && c.data.attachments.length > 0) {
					$('.kb_container-right').children('span').children('div').children("div:not(.kb-panel-attach)").css('display','none');
					$('.kb_container-right').removeClass('col-md-3').addClass('col-md-12');
				}
				else {
					$('.kb_container-right').css('display','none').removeClass('col-md-3');
				}
				$('.kb-article-content').find('a').attr("target","_blank");
				if($rootScope.properties.readOnlyPage == "true") {
					$rootScope.readOnly = true;
					$("[ng-click='c.toggleVersions()']").off("click").addClass("disabled");
				}
				return true;
			}
		}catch(e){
			return false;
		}
		return false;
	};

	c.attachToTask = function(){
		self = window;
		if (self.opener) {
			var lastSaved = self.opener.document.getElementById("onLoad_sys_updated_on").value;
			if (!lastSaved) {
				self.close();
				self.opener.g_form.addErrorMessage("Invalid action: Record needs to be saved first");
				return false;
			}
			var e = self.opener.document.getElementById("sys_uniqueValue");
			var taskID = e.value;


			var articleID = c.data.article_sys_id;
			var args = [];
			args.push(articleID);
			args.push(c.data.properties.attachFields);

			c.server.get({action : 'kbAttachArticle', value : articleID + "," + taskID}).then(function(resp){
				var fieldName = self.opener.fillField;
				var tableName = fieldName.split('.')[0];
				var targetFields = c.data.properties.attachFields;

        var articleContent = resp.data.articleContent;

				var names = [];
				if (targetFields) {
					var parts = targetFields.split(",");
					for(var i=0; i<parts.length; i++)
						names.push(parts[i]);
				}
				names.push('comments');
				names.push('description');

				var target = null;
				var targetName = null;
				for (var i=0;i<names.length; i++) {
					targetName = names[i];
					target = self.opener.document.getElementById(tableName + "." + targetName);
					if (target){
						var ed = self.opener.g_form.getGlideUIElement(targetName);
						if (ed && ed.type == 'reference') {
							self.opener.g_form.setValue(targetName, articleID);
						} else {
							var newValue = "";
							if (target.value == "")
								newValue = articleContent;
							else
									newValue = target.value + "\n" + articleContent;
								self.opener.g_form.setValue(targetName, newValue);
						}
						break;
					}

				}
				self.close();
			})
		}
	};
}