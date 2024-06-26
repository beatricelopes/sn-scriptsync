function(scope) {
	var c = scope.c,
	$uibModal = $injector.get('$uibModal');

	var options = {
			scope: scope,
			keyboard: true,
			templateUrl: 'kmImageModal',
			windowClass: 'image-modal-dialog'
		};
    
	c.openAttachmentsList = function(attachments){
		var options = {
			size:"md",
			scope: scope,
			keyboard: true,
			templateUrl: 'kmAttachmentsWidgetList',
			windowClass: c.isMobile ? 'attachments-list-modal-dialog' : 'attachments-list-modal-dialog kb-desktop'
		};
		c.attachmentsList = attachments;
		c.openModal(options);
	}

	
	c.openModal = function(options){
		c.instance = $uibModal.open(options);
	}
	

	c.closeModal = function(){

		if(c.instance){
			c.instance.close();
			c.instance = '';
		}

	}
}