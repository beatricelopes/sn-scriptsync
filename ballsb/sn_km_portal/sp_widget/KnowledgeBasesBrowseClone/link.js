function(scope,spAriaUtil) {
	var c = scope.c;
	$timeout = $injector.get('$timeout');
	spAriaUtil = $injector.get('spAriaUtil');
	c.toggleKbTiles = function(elm){
		$('.kb-browse-content .kb-hidden-tile').toggleClass('kb-hide-me');
		c.showMoreLink = !c.showMoreLink;

		if(elm == "more"){
			$('.kb-browse-content .kb-tile-block:nth-child(5) a:first').focus();
		}
	}
	
	c.updateSubscription = function(item, $event){
		$event.stopPropagation();
		$event.preventDefault();

		var input = {};
		input.id = item.sys_id;
		var notifySub = "";
		if(item.subscribed){
			input.action = 'unsubscribe';
			notifySub = "${Unsubscribed from knowledge base} "+ item.title;
		}else{
			input.action = 'subscribe';
			notifySub = "${Subscribed to knowledge base} "+ item.title;
		}

		c.server.get(input).then(function(r) {
			item.subscribed = !item.subscribed
			$timeout(function(){$('#subscribeButton_'+item.sys_id).focus()},0);
			//c.notity_subscription = notifySub;
			spAriaUtil.sendLiveMessage(notifySub);
		});
	};

	c.getKBLabel = function(kb,articleCount,questionCount,qaEnable){
		var kBLabel = '';
		if(qaEnable && c.data.sqaUiActive){
			kBLabel = c.data.kb_label_qa;
			kBLabel = kBLabel.toString().replace('{0}',kb).replace('{1}',articleCount).replace('{2}',questionCount);
		}else{
			kBLabel = c.data.kb_label;
			kBLabel = kBLabel.toString().replace('{0}',kb).replace('{1}',articleCount);
		}

		return kBLabel;
	};

	c.getTranslatedText = function(text, variable){
		return text.toString().replace('{0}',variable);
	};

	c.updateSubText = function(item,focus){

		if(focus){
			item.subscribedLabel=c.data.SUBSCRIBED_LABEL;
		//	$('.unsub_'+item.sys_id).html("<span>"+c.subscribedText+"</span>");
		}
		else{
			item.subscribedLabel=c.data.UNSUBSCRIBE_LABEL;
			//$('.unsub_'+item.sys_id).html("<span>"+c.unSubscribeText+"</span>");
		}

	};

	c.trimTitle = function(title){
		return title.substring(0,27);
	};
}