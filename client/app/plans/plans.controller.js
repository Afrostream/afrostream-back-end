'use strict';

angular.module('afrostreamAdminApp')
  .controller('PlansCtrl', function ($scope) {
    $scope.$watch('item', function () {
      if (!$scope.item) return;
      $scope.item.price = $scope.item.price || 0
    });
  });
