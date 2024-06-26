function(scope) {	
	var c = scope.c;
	
	//hide pinned articles on click of cross icon
	c.hidePinSection = function(elm) {
		scope.$evalAsync(function(){
			c.showPinnedArticles = !c.showPinnedArticles;
		});
		
		$('.kb-summary-block .pinned-articles').slideUp("slow", function() {
		});				
	};
	
	//show pinned articles on click of 'Show pinned articles' link
	c.showPinSection = function(elm) {
		c.showPinnedArticles = !c.showPinnedArticles;
		$('.kb-summary-block .pinned-articles').slideDown("slow", function() {			
		});
	};
}