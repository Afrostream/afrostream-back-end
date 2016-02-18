'use strict';

angular.module('afrostreamAdminApp')
  .controller('UsersCtrl', function ($scope, $http) {
    $scope.accessTokens = [];
    $scope.modalHooks.onItemLoaded = function () {
      $http({method:'GET', url: '/api/logs/', params: { userId: $scope.item._id,  type: 'access_token' } }).then(function (result) {
        $scope.accessTokens = result.data;
      });
    };
  });
