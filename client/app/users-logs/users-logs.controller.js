'use strict';

angular.module('afrostreamAdminApp')
  .controller('UsersLogsCtrl', function ($scope, $http, $interval, jobs) {
    $scope.accessTokens = [];
    $scope.countUsers = 'Please wait...';
    $scope.countActiveUsers30 = 'Please wait...';
    $scope.countActiveUsers7 = 'Please wait...';
    $scope.countSignin7 = 'Please wait...';
    $scope.countActiveUsersByDays30 = [];

    $http.get('/api/stats/count-users', { params: { days: 7 } }).then(function (result) {
      $scope.countUsers = result.data.count;
    });

    $http.get('/api/stats/count-active-users', { params: { days: 30 } }).then(function (result) {
      $scope.countActiveUsers30 = result.data.count;
    });

    $http.get('/api/stats/count-active-users', { params: { days: 7 } }).then(function (result) {
      $scope.countActiveUsers7 = result.data.count;
    });

    $http.get('/api/stats/count-active-users-by-days', { params: { days: 30 } }).then(function (result) {
      var data = result.data;
      // casting to numeric types.
      data.forEach(function (o) { o.count = Number(o.count) });
      // searching min & max
      var maxNbUsers = data.reduce(function (p, c) { return c.count > p ? c.count : p }, 0);
      var minNbUsers = data.reduce(function (p, c) { return c.count < p ? c.count : p }, Infinity);
      var delta = maxNbUsers - minNbUsers;
      // creating color & margin
      data.forEach(function (activeUsersByDay) {
        var green = Number(Math.round(255 - (activeUsersByDay.count - minNbUsers) / delta * 255)).toString(16);
        // pad with 0
        if (green.length <= 1) green = '0' + green;
        activeUsersByDay.color = '#00' + green + '00';
        //
        activeUsersByDay.marginRight = new Date(activeUsersByDay.date).getDay() ? 1 : 5;
      });
      $scope.countActiveUsersByDays30 = data.reverse();
    });

    $http.get('/api/stats/count-signin', { params: { days: 7 } }).then(function (result) {
      $scope.countSignin7 = result.data.count;
    });

    $http.get('/api/logs', { type: 'access_token'}).then(function (result) {
      $scope.accessTokens = result.data;
    });
  });
