var SPSEOHeaderTagsArticleSearchSNC = Class.create();
SPSEOHeaderTagsArticleSearchSNC.prototype = Object.extendsObject(global.SPSEOHeaderTags, {
    generateCustomTagsForSEO: function(){
		return ['<meta name="robots" content="noindex, follow">'];
	},
	
	generateSEOHTML: function(){
		this.urlObj = global.SPSEOHeaderTagsSNC.getPageUrlObj();
		
		var URLParameters = {};

		var queryParams = this.urlObj.queryParams;
		var params = queryParams.substr(queryParams.indexOf("?") + 1);
		var paramList = params.split("&");

		for(var i in paramList){
			var paramKeyVal = paramList[i].split("=");
			URLParameters[paramKeyVal[0]]=paramKeyVal[1];
		}
		
		var query = decodeURIComponent(URLParameters.query || "");
		var page = URLParameters.page || 1;
		if(page < 1) page == 1;
		
		var pageCount = parseInt(gs.getProperty('glide.knowman.search.articles_per_page', '20'));
		
		var obj = {
			attachment: true,
			category_as_tree: false,
			keyword: query,
			portal_suffix: this.urlObj.siteName,
			order: query? "relevancy,true": "sys_view_count,true",
			start: (page - 1) * pageCount,
			end: page * pageCount,
			variables: {
				kb_knowledge_base: URLParameters.kb_knowledge_base? decodeURIComponent(URLParameters.kb_knowledge_base).split(','): [],
				kb_category: URLParameters.kb_category? decodeURIComponent(URLParameters.kb_category).split(','): []
			}
		};
		
		var searchRequest = new sn_km_portal.KBPortalService();
		var res = (searchRequest.getResultData(obj));
		
		var count = res.meta.count || 0;
		var results = res.results;
		
		var searchResultHTML = count == 0? '<p>' + gs.getMessage('No results found') + '</p>': results.map(function(result){
			return '<div>' +
				'<a href="' + result.link + '">' + result.title + '</a>' + 
			'</div>' + '<br/>';
		}).join('\n');
		
		var title = query? gs.getMessage('Search results for {0}', query): gs.getMessage('Articles');

		if(count == 0)
			return '<div>' + 
				'<h2>' + title + '</h2>' +
				'<main>' + searchResultHTML + '</main>' + 
			'</div>';
		
		var totalCount = Math.ceil(count/pageCount);
		var baseUrl = this.urlObj.siteURL + '?';
		for(var key in URLParameters){
			if(key != 'page')
				baseUrl += key + '=' + URLParameters[key] + '&';
		}
		baseUrl += 'page=';
		var footerContent = [];
		for(var j = 1; j <= totalCount; j++){
			if(page == j)
				footerContent.push('<span>' + j + '</span>');
			else
				footerContent.push('<a href="'+ baseUrl + j +'">' + j + '</a>');
		}
		
		return '<div>' + 
			'<h2>' + title + '</h2>' +
			'<main>' + searchResultHTML + '</main>' + 
			'<footer>' + 
				footerContent.join('<span> | </span>') + 
			'</footer>' + 
		'</div>';
	},

    type: 'SPSEOHeaderTagsArticleSearchSNC'
});