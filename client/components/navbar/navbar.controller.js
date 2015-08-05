'use strict';

angular.module('afrostreamAdminApp')
  .controller('NavbarCtrl', function ($scope, Auth) {
    $scope.user = Auth.getCurrentUser();
  });
