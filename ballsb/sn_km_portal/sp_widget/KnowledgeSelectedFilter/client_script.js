function($rootScope,$scope,spAriaUtil,$timeout,i18n) {
	/* widget controller */
	var c = this;
	c.visible = true;
	c.items = [];
	//to determine, whether the event source belongs to this widget or not.
	c.sourceEventFlag=false;
	var buildAriaMsg = $rootScope.$on('sp.kb.build.aria.msgs',function (event,data){
		var ariaMsgs=[],ariaMsg;
		if(data && data.hasOwnProperty("article_count")){
				count = data.article_count || '0';
				if(data.keyword && $rootScope.isMobile){
					c.title = count + " ${Results}";
				}else{
					if(count != 1)
						c.title = data.keyword ? c.data.messages.SHOWING+' '+count + ' ${results for} "'+data.keyword+'"': c.data.messages.SHOWING+' '+ count + " ${Results}";
					else
						c.title = data.keyword ? c.data.messages.SHOWING+' '+count + ' ${result for} "'+data.keyword+'"': c.data.messages.SHOWING+' '+ count + " ${Result}";
				}
				ariaMsgs[ariaMsgs.length] = {'message':c.title};
		if(c.items.length > 0){
				var t=c.data.messages.APPLIED_FILTERS+': ';
				if (c.items.length ==1)
					t= c.data.messages.APPLIED_FILTER+': ';
					ariaMsg = c.items.reduce(function (result, item) {
							return result +item.label+',';
						},t);
				ariaMsgs[ariaMsgs.length]={'message':ariaMsg.substring(0,ariaMsg.length-1)};
		}
		/*Timeout required as screen reader needs to readout the other message.*/
		$timeout(function(){
					spAriaUtil.sendLiveMessage([].concat(ariaMsgs.slice()));
		 },1500);
		}
	});
	//set selections from data
	var refreshFilter = $rootScope.$on('sp.kb.refresh.filter',function (event,data){
		if(data){
			c.items = data;
			c.visible = true;
			c.items.forEach(function(item){
			if(c.data.messages.hasOwnProperty(item.id))
				item.label = c.data.messages[item.id];			
			});
			if (c.sourceEventFlag){
				c.sourceEventFlag=false;
				if(c.items.length > 0)
					$('span.kb-breadcrumb-item button').first().focus();
				else{
					angular.element('#kb_search_input').focus();
				}
			}
		}else{
			c.visible = false;
		}
	});

	//throw event on selection removal
	c.removeSelection = function(item,index){
		c.items.splice(index,1);
		c.sourceEventFlag=true;
		if(item.id == "kb_clear_url_filter"){
			c.clearAllFiters();
		}else{
			$rootScope.$emit('sp.kb.updated.filter',item);
		}
	};

	//clear all filter
	c.clearAllFiters = function(){
		c.sourceEventFlag=true;
		c.items = [];
		$rootScope.$emit('sp.kb.updated.filter','clearall');
	};
	
	c.generateClearMessage = function(item){
		return i18n.format(c.data.messages.CLEAR_FILTER_FOR,item);	
	}

	$scope.$on('$destroy',function(){
		refreshFilter();
		c.sourceEventFlag=false;
	});
}