'use strict';

angular.module('afrostreamAdminApp')
  .controller('UsersCtrl', function ($scope, $http) {
    $scope.accessTokens = [];
    $scope.modalHooks.onItemLoaded = function () {
      $http.get('/api/users/' + $scope.item._id + '/logs').then(function (result) {
        $scope.accessTokens = result.data;
      });
    };
  });
