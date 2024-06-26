function(){
	return {
		template:
		'<nav class="cm-pagination" aria-label="Knowledge Pagination">'+
		'<ul class="pagination" style="cursor:pointer;">'+
		'<li ng-class="{disabled:currentPage === 1}" class="page-item">'+
		'<a ng-click="changePage(currentPage - 1)" class="page-link" href="javascript:void(0);" aria-label="Previous">'+
		'<i class="fa fa-caret-left" data-toggle="tooltip" title = "${Previous page}" aria-hidden="true"></i>'+
		'<span class="sr-only">${Previous}</span>'+
		'</a>'+
		'</li>'+
		'<li ng-repeat="index in displayPages track by $index" ng-class="{active:currentPage === index}">'+
		'<a href="javascript:void(0);" ng-click="changePage(index)">{{index}}</a>'+
		'</li>'+
		'<li ng-class="{disabled:currentPage === pageCount && pageCount != 1}" class="page-item"> '+
		'<a ng-click="changePage(currentPage + 1)" class="page-link" href="javascript:void(0);" aria-label="Next">'+
		'<i class="fa fa-caret-right" data-toggle="tooltip" title = "${Next page}" aria-hidden="true"></i>'+
		'<span class="sr-only">${Next}</span>'+
		'</a>'+
		'</li>'+
		'</ul>'+
		'</nav>'+
		'<style>'+
		'.tooltip-inner {white-space:nowrap;max-width:none;}'+
		'.tooltip.top{margin-top:-6px;padding-top: 5px;padding-right: 0px;padding-bottom: 5px;padding-left: 0px;}'+
		'</style>',
		scope: {
			pagedata:"=",
			onPageChange:"&",
			getNextSetCount:"&"
		},

		controller : function($scope, $rootScope){
			$scope.countPages = function (totalCount, pageSize) {
				return Math.ceil(totalCount / pageSize);
			};

			$scope.setPageRange = function (startIndex) {
				$scope.displayPages = [];
				var pageCount = $scope.countPages($scope.pagedata.totalCount, $scope.pagedata.pageSize);
				var end = startIndex + ($scope.pagedata.noOfLinks-1);

				while(end > pageCount && pageCount != 1){end--;}

				while(startIndex > 0 && startIndex <= end && (pageCount == 1 || end <= pageCount)){
					$scope.displayPages.push(startIndex++);
				}

				$scope.pageCount = pageCount;
			};

			var unRegReset =$rootScope.$on('sp.kb.updated.pagination.count',function (event,data){
				$scope.initialize();
			});

			var startIndex;
			$scope.initialize = function(){
				//Initialize the pagination
				startIndex = 1;
				$scope.setPageRange(startIndex);
				$scope.currentPage = 1;
			}
			$scope.initialize();

			$scope.changePage = function (index) {
				if(index == $scope.currentPage) {
					return;
				}
				if (index < 1 || index > $scope.pageCount) {
					return;
				}
				if(index > $scope.currentPage){
					$scope.currentPage = index;
					if($scope.pagedata.noOfLinks==1){
						startIndex += ($scope.pagedata.noOfLinks);
						$scope.setPageRange(startIndex);
					}else if($scope.currentPage % ($scope.pagedata.noOfLinks-1) == 1 || $scope.pagedata.noOfLinks==2){
						startIndex += ($scope.pagedata.noOfLinks-1);
						$scope.setPageRange(startIndex);
					}
				}else if(index < $scope.currentPage){
					if($scope.pagedata.noOfLinks==1 && $scope.currentPage != 1){
						startIndex -= ($scope.pagedata.noOfLinks);
						$scope.setPageRange(startIndex);
					}else if(($scope.currentPage % ($scope.pagedata.noOfLinks-1) == 1 || $scope.pagedata.noOfLinks==2)&& $scope.currentPage != 1){
						startIndex -= ($scope.pagedata.noOfLinks-1);
						$scope.setPageRange(startIndex);
					}
					$scope.currentPage = index;
				}
				$scope.onPageChange({currentPage: $scope.currentPage});
			};

			var unRegPageResult = $rootScope.$on('sp.kb.updated.pagination.articleCount',function (event,data){
				$scope.pagedata.totalCount = $scope.pagedata.totalCount+data.count;
				$scope.setPageRange(startIndex);
			});

			$scope.$on("$destroy", function() {
				unRegPageResult();
				unRegReset();

			});

		}
	}
}