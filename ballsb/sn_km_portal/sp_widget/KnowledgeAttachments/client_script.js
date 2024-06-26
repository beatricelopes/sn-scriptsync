function($rootScope, $scope, spUtil, cabrillo) {
  /* widget controller */
  var c = this;

	c.isMobile = spUtil.isMobile() || cabrillo.isNative();
	$scope.attachments = $rootScope.attachments;

}