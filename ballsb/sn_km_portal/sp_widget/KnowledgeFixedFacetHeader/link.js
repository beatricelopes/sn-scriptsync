function(scope) {	
	var c = scope.c;
	$rootScope = $injector.get("$rootScope");
	
	c.doneClick = function(){
		$rootScope.showFacet = false;
		if(!$rootScope.showLanguageFacet)
			setTimeout(function() { $('span.filter-icon').focus();},0);
		else
			setTimeout(function() { $('button.showLangIcon').focus();},0);
	}
}