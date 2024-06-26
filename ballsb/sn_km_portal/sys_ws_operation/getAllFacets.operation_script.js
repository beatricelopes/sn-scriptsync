(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
	var payload = request.body.data;
	var parameters = {};

	// Create the request from the payload
	if (payload && payload.params){
		parameters = payload.params;
		if(parameters){

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
				// If error in result
				return new sn_ws_err.BadRequestError("Invalid input data provided"); 
			}
		}else{
			// If payload format is not as expected return error
			return new sn_ws_err.BadRequestError("Invalid input parameters"); 
		}
	}else{
		// If there is no payload we can return an error.
		return new sn_ws_err.BadRequestError("No input data provided"); 
	}

	//make sure we always get strings from the parameter map
	function getParamAsString(paramName) {
		var val = parameters[paramName];
		if (val){
			if(typeof val === 'object')
				return new global.JSON().encode(val) + '';
			else
				return val+'';
		}
		return '';
	}

})(request, response);