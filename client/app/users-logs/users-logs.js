'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('users-logs', {
        url: '/users-logs',
        templateUrl: 'app/users-logs/users-logs.html',
        controller: 'UsersLogsCtrl',
        type: 'users-logs'
      });
  });