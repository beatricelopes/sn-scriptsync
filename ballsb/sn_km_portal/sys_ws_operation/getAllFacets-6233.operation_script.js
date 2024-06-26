(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
	var kbService = new KBPortalService();
	var result = kbService.getAllFacets(
	getParamAsString("keyword"),
	getParamAsString("language"),
	getParamAsString("variables"),
	getParamAsString("query"),
	getParamAsString("order"),
	getParamAsString("paginationMinCount"),
	getParamAsString("portal_suffix"),
	true	
	);
	
	var status;
	
	//We want to keep the browser from caching these responses
	response.setHeader("Cache-Control", "no-cache,no-store,must-revalidate,max-age=-1");
	response.setHeader("Pragma", "no-store,no-cache");
	response.setHeader("Expires","Thu, 01 Jan 1970 00:00:00");
	response.setContentType('application/json');
	response.setStatus(status);
	
	if (result) {
		status = 200;
		return result;
	} else {
		status = 404;
	}
	
	//make sure we always get strings from the parameter map
	function getParamAsString(paramName) {
		if (request.queryParams.hasOwnProperty(paramName))
			return request.queryParams[paramName] + '';
		
		return '';
	}
	
})(request, response);