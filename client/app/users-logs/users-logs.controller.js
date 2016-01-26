'use strict';

angular.module('afrostreamAdminApp')
  .controller('UsersLogsCtrl', function ($scope, $http, $interval, jobs) {
    $scope.accessTokens = [];
    $scope.countUsers = 'Please wait...';
    $scope.countActiveUsers30 = 'Please wait...';
    $scope.countActiveUsers7 = 'Please wait...';
    $scope.countSignin7 = 'Please wait...';

    $http.get('/api/stats/count-users', { params: { days: 7 } }).then(function (result) {
      $scope.countUsers = result.data.count;
    });

    $http.get('/api/stats/count-active-users', { params: { days: 30 } }).then(function (result) {
      $scope.countActiveUsers30 = result.data.count;
    });

    $http.get('/api/stats/count-active-users', { params: { days: 7 } }).then(function (result) {
      $scope.countActiveUsers7 = result.data.count;
    });

    $http.get('/api/stats/count-signin', { params: { days: 7 } }).then(function (result) {
      $scope.countSignin7 = result.data.count;
    });

    $http.get('/api/users/logs').then(function (result) {
      $scope.accessTokens = result.data;
      console.log(result);
    });
  });
