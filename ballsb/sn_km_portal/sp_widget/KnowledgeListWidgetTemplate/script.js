(function() {
	/* populate the 'data' object */
	/* e.g., data.table = $sp.getValue('table'); */
	data.useDocumentViewer = (gs.getProperty('sn_km_portal.glide.knowman.serviceportal.use_document_viewer', 'false') == 'true') && GlidePluginManager.isActive('com.snc.documentviewer');
	data.externalContentLabel = gs.getMessage(gs.getProperty('sn_km_intg.glide.knowman.external.ui_label_for_external_content', 'External Content')) || gs.getMessage('External Content');
	options.kb_rating_style = options.kb_rating_style ? options.kb_rating_style == "true" : true;
	options.show_secondary_information = options.show_secondary_information != null ? options.show_secondary_information : true;
	data.isKBView=$sp.getParameter("id") == "kb_article_view";
})();