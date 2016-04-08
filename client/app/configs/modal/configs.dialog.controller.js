'use strict';

angular.module('afrostreamAdminApp')
  .controller('ConfigsDialogCtrl', function ($scope, $filter, Config) {

    $scope.$watch('item.data', function (json) {
      $scope.jsonString = $filter('json')(json);
    }, true);

    $scope.$watch('jsonString', function (json) {
      try {
        $scope.item.data = JSON.parse(json);
        $scope.wellFormed = true;
      } catch (e) {
        $scope.wellFormed = false;
      }
    }, true);


    $scope.loadConfigs = function (query) {
      return Config.query({query: query}).$promise;
    };
  })
;
