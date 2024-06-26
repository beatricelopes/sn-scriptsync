function($rootScope,$scope,spAriaUtil) {
	/* widget controller */

	var c = this;
	c.selected_order = "sys_view_count" ;
	c.sort_items = c.data.sort_items;
	c.hide_relevancy = c.data.hide_relevancy;
	c.order_desc = true;
	c.showRelevancy = false;
	c.title = "";
	c.sortOverlay = false;
	c.sortLabel = "${Views}";
	var overlaySortFirstEL='';
	var overlaySortLasttEL='';
	c.doneClick = function() {
			c.sortOverlay = !c.sortOverlay;
			if (c.sortOverlay) {
				  overlaySortFirstEL=$('.sort-done button')[0];
					overlaySortLasttEL=$('.res-ul-class li:last-child button')[0];
					setTimeout(function() {
							$('.sort-done button').focus()
					}, 0);
			} else {
					$('.sort-label').focus();
			}
	}
	c.showWidget = false;
	var refreshSort = $rootScope.$on('sp.kb.refresh.sortorder',function (event,data){
		var count ="";
		if(data){
			count = data.article_count || '0';
			if(data.hasOwnProperty("article_count")){
				c.showRelevancy = data.keyword ? true :false;
				if(data.keyword && $rootScope.isMobile){
					c.title = count + " ${Results}";
				}else{
					c.title = data.keyword ? count + ' ${Results for} "'+data.keyword+'"': count + " ${Results}";
				}
			}
			if(data.order){
				if(data.order){
					c.selected_order = data.order;
					var item = {
						label : data.order,
						order_desc : data.order_desc
					};
					c.setSortedLabel(item);
					for(var sortItem in c.data.sort_items) {
						if(c.data.sort_items[sortItem].id == c.selected_order){
							c.sortLabel = c.data.sort_items[sortItem].label;
							c.data.sort_items[sortItem].order_desc = data.order_desc;
						}
					}
				}
				if(data.order_desc){
					c.order_desc = data.order_desc;
				}
				if(data.order == "relevancy"){
					c.sortLabel = "${Relevance}";
				}
			}
		}
		c.showWidget = true;
	});


	c.updateResultOrder = function(item){
		//reverse order direction if same field is clicked again
		if(c.selected_order == item.id && item.id != 'relevancy')
			item.order_desc = !item.order_desc;

		//update other widgets with new order
		if(!(c.selected_order == 'relevancy' && item.id =='relevancy')){
			$rootScope.$emit('sp.kb.updated.sortorder',item);

			if(item.id != 'relevancy'){
				var input ={};
				var orderType = "desc";
				if(item.order_desc == false){
					orderType = "asc";
				}
				$rootScope.dafaultSortId = item.id;
				$rootScope.dafaultSortDesc = item.order_desc;
				var preferOrder = item.id+":"+orderType;
				input.preferOrder = preferOrder;
				input.requestType = "setUserPreference";
				c.server.get(input).then(function(r){

				});
			}
		}
		c.selected_order = item.id;
		c.order_desc = item.order_desc;
		c.setSortedLabel(item);
	};

	c.setSortedLabel = function (item){
		if(c.selected_order == "relevancy"){
			c.sortLabel = "${Relevance}";
			c.notity_order = "${Sorted by} ${Relevance}"
		}else{
			c.sortLabel = item.label;
			if(item.order_desc)
				c.notity_order = "${Sorted by} " + item.label + " ${Descending}.";
			else
				c.notity_order = "${Sorted by} " + item.label + " ${Ascending}.";
		}
		spAriaUtil.sendLiveMessage(c.notity_order);
	};

	c.getSortLabel = function(item){
		if(item.order_desc)
			return "${Sort by} " + item.label + " ${Descending}";
		else
			return "${Sort by} " + item.label + " ${Ascending}";
	};
	
	c.onOverlayKeyDown = function(event){
    if ( event.keyCode === 27 ) { // ESC
       c.doneClick();
    }
	};

	$scope.$on('$destroy',function(){
		refreshSort();
	});
	/*To handle the tab/ (Shift+tab) navigation in the overlay*/
	$('#overlaySort').keydown(function(e) {
			var KEY_TAB = 9;
			handleShiftTab = function() {
					if (document.activeElement == overlaySortFirstEL) {
							e.preventDefault();
							overlaySortLasttEL.focus();
					}
			}
			handleTab = function() {
					if (document.activeElement == overlaySortLasttEL) {
							e.preventDefault();
							overlaySortFirstEL.focus();
					}
			}

			if (e.which == KEY_TAB) {
					if (e.shiftKey) {
							handleShiftTab();
					} else {
							handleTab();
					}
			}
	});
	
}