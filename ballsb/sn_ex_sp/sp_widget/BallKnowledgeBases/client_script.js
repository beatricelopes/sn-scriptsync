api.controller = function($scope, spUtil) {
    var c = this;

    c.kb_toggle = false;
    c.item_toggle = false;
    c.guide_toggle = false;
    c.task_toggle = false;
    c.record_toggle = false;


    function get() {
        spUtil.update($scope);
    }

    $scope.remove = function(event, sysId) {
        event.stopPropagation();
        event.preventDefault();
        $scope.data.removeID = sysId;
        spUtil.update($scope);
    };

    // pagination
    $scope.previousPage = function() {
        if ($scope.data.pagination.currentPage > 1)
            $scope.data.pagination.currentPage = $scope.data.pagination.currentPage - 1;
        else
            $scope.data.pagination.currentPage = 0;

        $scope.data.op = "previous";
        $scope.data.target = null;

        get();
    };

    $scope.nextPage = function() {
        $scope.data.op = "next";
        $scope.data.target = null;
        $scope.data.pagination.currentPage = $scope.data.pagination.currentPage + 1;
        get();
    };
};