function($scope, $rootScope, $timeout) {	
	var c = this;			
	
	$rootScope.showKbHomeLink = c.data.showKbHomeLink;
	
	$scope.$on("sp.update.breadcrumbs", function(e, list) {		
		c.breadcrumbs = list;
	});
	
	$timeout(function(){
		if($rootScope.readOnly){
			$(".nav-pills").find("a").removeAttr("href").addClass("disabled"); 
		}
	},200);
 
}