function($scope,$rootScope) {
	var c = this;
	//set tile from options
	c.options.title = c.options.title || "${Refine Results}";
	c.clearAllEnable = false;
	c.items = [];
	c.articleCount = "";

	var refreshFilterIcon = $rootScope.$on('sp.kb.refresh.filter',function (event,data){
		if(data){
			c.items = data;
		}
		if(c.items.length>0){
			c.clearAllEnable = true;
		}else{
			c.clearAllEnable = false;
		}
	});
	c.clearAllFiters = function(){
		c.clearAllEnable = false;
		c.items = [];
		$rootScope.$emit('sp.kb.updated.filter','clearall');
		$('button.kb-fixed-facet-done').focus();
	};
var refreshResultCount = $rootScope.$on('sp.kb.refresh.sortorder',function (event,data){
	var count ="";
		if(data){
			count = data.article_count || '0';
			if(data.hasOwnProperty("article_count")){
					c.articleCount = count + " ${Results}";
			}
		}
});
	$scope.$on('$destroy',function(){
		refreshResultCount();
		refreshFilterIcon();
	});
}

