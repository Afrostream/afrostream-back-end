'use strict';

angular.module('afrostreamAdminApp')
  .directive('users', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/users/users.html',
      controller: 'UsersCtrl'
    };
  });
