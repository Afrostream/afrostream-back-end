'use strict';

angular.module('afrostreamAdminApp')
  .directive('sideBar', function ($cookieStore) {
    return {
      templateUrl: 'components/side-bar/side-bar.html',
      restrict: 'EA',
      controller: 'SidebarCtrl',
      replace: true,
      link: function ($scope) {
        /**
         * Sidebar Toggle & Cookie Control
         */
        var mobileView = 992;

        $scope.getWidth = function () {
          return window.innerWidth;
        };

        $scope.$watch($scope.getWidth, function (newValue) {
          if (newValue >= mobileView) {
            if (angular.isDefined($cookieStore.get('toggle'))) {
              $scope.toggle = !$cookieStore.get('toggle') ? false : true;
            } else {
              $scope.toggle = true;
            }
          } else {
            $scope.toggle = false;
          }

        });

        $scope.toggleSidebar = function () {
          $scope.toggle = !$scope.toggle;
          $cookieStore.put('toggle', $scope.toggle);
        };

        window.onresize = function () {
          $scope.$apply();
        };
      }
    };
  });
