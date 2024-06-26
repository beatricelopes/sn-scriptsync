function ($scope, spUtil, $uibModal, $location) {
	var c = this;
	
	$scope.$on('record.updated', function(name, data) {
		//on record state change, update the value
		for (i = 0; i < data.changes.length; i++){
			var field = data.changes[i];
			if (field == "state") {
				c.data.state = data.record.state.value;
			}
		}
	});
	
	c.viewCase = function() {
		$location.url('?id='+ c.data.page + '&table=' + c.data.table + '&sys_id=' + c.data.sys_id + '&view=csp');	
  };
	
	c.modalMessage = c.data.confirmDeleteMessage;
	
	c.close = function(){
		c.showModal();
	};
	
	var instance;
	c.showModal = function () {
		var templateUrl = 'close_template.html';
		var size = 'md';

		try{
			var options = {
				size: size,
				scope: $scope,
				backdrop: 'static',
				templateUrl: templateUrl
			};
			instance = $uibModal.open(options);
		}
		catch(err){
			console.log(err);
		}
	};

	c.cancel = function () {
		if(instance)
			instance.dismiss('cancel');
	};
	
	c.action = function(table, id, state, type) {
		//Don't redirect to survey if case is closed from New state
		//States - New:1, Open:10, Awaiting Info: 18, Resolved: 6, Closed:3, Cancelled: 7.
		if($scope.data.state == '1')
			c.data.redirect = "case";
		else
			c.data.redirect = "survey";
		c.data.action = 'update';
		c.data.state = state;
		c.data.sys_id = id;
		c.data.table = table;
		c.data.type = type;
		c.server.update().then(function(response) {
			if(state==3 && $scope.data.url && c.data.redirect){
				$location.url($scope.data.url);
				spUtil.addInfoMessage(c.data.successMsg);
			}
			else
				c.cancel();
		});
	};
}