function($rootScope, $location) {
  /* widget controller */
  var c = this;
  c.template = "kb_article_list_template";
  $rootScope.$on("$locationChangeSuccess", function() {
		var id = $location.search().sys_kb_id ? 'sys_kb_id' : 'sys_id';
		c.data.sys_id = $location.search()[id];
		c.server.update();
	});
}