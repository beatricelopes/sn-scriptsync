function(scope) {	
	var c = scope.c;
	
	c.bindFunctions = function(){
		var collapseIconId = "collapse_icon_"+c.data.instanceid;
		$('#collapse_'+c.data.instanceid).on('shown.bs.collapse', function(){
			$("#"+collapseIconId).removeClass( "fa-plus-square-o" ).addClass( "fa-minus-square-o" );
			$('#panel_'+c.data.instanceid).removeClass("remove-bottom-border");
		});
		$('#collapse_'+c.data.instanceid).on('hidden.bs.collapse', function(){
			$("#"+collapseIconId).removeClass( "fa-minus-square-o" ).addClass( "fa-plus-square-o" );
			$('#panel_'+c.data.instanceid).addClass("remove-bottom-border");
		});
	}
	
	setTimeout(function(){
		c.bindFunctions();
	});
}