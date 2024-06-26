data.tsQueryId = $sp.getParameter("sysparm_tsqueryId") || "";
data.rating = 0;
options.kb_rating_style = options.kb_rating_style ? options.kb_rating_style == "true" : true;
data.isMESP = ($sp.getParameter("id") == "me_kb_view") || false;

if (!input) {
    getSystemProperties();
    data.messages = {};
    data.messages.HELPFUL=gs.getMessage("Helpful?");
    data.messages.HELPFUL_GROUP = gs.getMessage("Was this article helpful?");
    data.messages.HELPFUL_YES = gs.getMessage("Yes,this article was helpful");
    data.messages.HELPFUL_NO = gs.getMessage("No,this article was not helpful");
	data.messages.THANKYOU_RATING=gs.getMessage("Thank you for the feedback.");
}

if (input) {
    if (input.action == "saveHelpful") {
        data.response = options.response || gs.getMessage('Thank you');
        var kbPortal = new KBPortalService();
        var params = {};
        params.article = input.article_sys_id;
        params.useful = (input.useful == 'useful_yes') ? 'yes' : 'no';
        params.user = gs.getUserID();
        params.session_id = gs.getSessionID();
        params.search_id = data.tsQueryId;
        var resp = kbPortal.saveUsefulWithParams(params) + '';
        var successMessage = options.feedback_message ? options.feedback_message : gs.getMessage('Thank you for the feedback.');
        data.response = resp.includes('true') ? successMessage : gs.getMessage('You have reached the daily limit for comments posted by a user.');
        data.success = resp.includes('true');
        data.helpfulresp = resp;
    } else if (input.action == 'getHelpful') {
        data.percent = getPercent();
        data.helpfulContent = gs.getMessage("{0}% found this helpful", data.percent + '');
    } else if (input.action === 'submit_rating') {
        var kbPortal = new KBPortalService();
        data.response = kbPortal.submitRating(input.rating, input.article_id);
    }
}

function getPercent() {
    var fbs = new GlideRecord("kb_feedback");
    fbs.addQuery("useful", "yes");
    fbs.addQuery("article", input.article_sys_id);
    fbs.query();
    var useful_yes = fbs.getRowCount();
    fbs = new GlideRecord("kb_feedback");
    fbs.addNotNullQuery("useful");
    fbs.addQuery("article", input.article_sys_id);
    fbs.query();
    var useful_total = fbs.getRowCount();

    var percentage = (useful_total > 0) ? Math.round(useful_yes / useful_total * 100) : 0;
    return percentage;
}

function getSystemProperties() {
    data.actionablefeedback_helpful_enabled = gs.getProperty('glide.knowman.feedback.enable_actionable_feedback_for_helpful', 'false');
    data.rating_threshold = gs.getProperty('glide.knowman.feedback.enable_actionable_feedback_for_rating', "");
    data.show_helpful = gs.getProperty('glide.knowman.show_yn_rating', 'true');
}