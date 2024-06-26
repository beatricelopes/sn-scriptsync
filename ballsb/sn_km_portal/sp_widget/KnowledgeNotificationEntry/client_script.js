function($scope) {
  /* widget controller */
  var c = this;
	
	$scope.$on("$destroy", function () {
		$('.kb_user_subs_pref').remove();
  });
}