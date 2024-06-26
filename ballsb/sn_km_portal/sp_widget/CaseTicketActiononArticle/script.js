(function(data) {
	if(!GlidePluginManager.isActive("com.snc.csm_ml"))
		return;
	
	var caseSysId = $sp.getParameter("sys_case_id");
	var kbPortalService = new KBPortalService();
	
	if(!gs.nil(caseSysId))
		kbPortalService.getCaseInfo(caseSysId, data);
	
	if (input && input.action === 'update' && input.sys_id && input.table) 
		kbPortalService.performAction(input, data);
	
})(data);