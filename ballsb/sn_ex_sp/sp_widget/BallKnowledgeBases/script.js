(function() {
    var portalId = $sp.getPortalRecord().getUniqueValue();
    var favoritePage = new sn_ex_sp.FavoritesPage(portalId);

    var gr;
    if (input) {
        gr = new GlideRecord("sp_favorite");
        if (gr.get('reference_document', input.removeID)) {
            var removeMsg = gs.getMessage("Removed from your favorites");
            gs.addInfoMessage(removeMsg);
            gr.deleteRecord();
        }
    }

    var favoriteApi = new sn_ex_sp.FavoriteAPI();
    var qsConfig = $sp.getValue('quick_start_config');
    var favoriteIcon = favoriteApi.getFavoriteIcon(qsConfig);
    data.emptyStateIcon = favoriteIcon.checkIcon;
    data.contentTypes = favoriteApi.getFavoriteContentTypeWithCount();
    data.totalContentCount = data.contentTypes[0].count;
    if (data.totalContentCount == 0) {
        return;
    }
    data.contentList = favoritePage.getAllFavoritesWithContent(0, 100, true);

    var favorites = [];
    var kbFavorites = [];
    var itemFavorites = [];
    var guideFavorites = [];
    var taskFavorites = [];
    var recordFavorites = [];

    data.hasMore = false;

    for (var i = 0; i < data.contentList.length; i++) {
        var fav = {};
        fav.name = data.contentList[i].primaryField;
        fav.tableName = data.contentList[i].tableName;
        fav.sys_id = data.contentList[i].sysId;
        fav.type = data.contentList[i].type;

        switch (fav.type) {
            case 'Request':
                itemFavorites.push(fav);
                break;
            case 'Article':
                kbFavorites.push(fav);
                break;
            case 'Task':
                taskFavorites.push(fav);
                break;
            case 'Record':
                recordFavorites.push(fav);
                break;
        }
		favorites.push(fav);
    }

    data.kbFavorites = kbFavorites;
    data.itemFavorites = itemFavorites;
    data.guideFavorites = guideFavorites;
    data.taskFavorites = taskFavorites;
    data.recordFavorites = recordFavorites;
    data.favorites = favorites;
})();