function(scope,element,attrs){
	var c = scope.c;
	if(scope.options.template == 'kb_facet_dropdown_select'){
		//initate and bind to select2
		setTimeout(function(){
			var selectID = $("#select_filter_"+scope.data.instanceid).select2({
				minimumResultsForSearch: scope.options.min_result_count || 10,
				placeholder: "${Filter}"
			});
		}, 0);
	}
	
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
	};
	
	setTimeout(function(){
		c.bindFunctions();
	});
}