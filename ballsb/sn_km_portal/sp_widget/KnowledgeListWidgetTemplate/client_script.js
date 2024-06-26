function($filter,spUtil,cabrillo,$rootScope, i18n) {
	/* widget controller */
	var c = this;
	c.isNative = cabrillo.isNative() && c.options.override_mobile;
	
	//Use KB specific stylic for all portals unless rating style is set.
	c.KBRatingStyle = c.options.kb_rating_style;

	c.getOrderedItems = function() {
		var filtered = $filter('limitTo') (c.options.result, c.options.max_records);
		return $filter('orderBy') (filtered, 'count', c.options.reverse);
	}
}