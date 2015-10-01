'use strict';

angular.module('afrostreamAdminApp')
  .controller('MainCtrl', function ($scope, $http, Dashboard) {
    $scope.all = Dashboard.query().$promise.then(function (data) {
      $scope.all = data;
      $scope.licensors = $scope.all[0].count;
      $scope.users = $scope.all[1].count;
      $scope.categorys = $scope.all[2].count;
      $scope.movies = $scope.all[3].count;
      $scope.seasons = $scope.all[4].count;
      $scope.episodes = $scope.all[5].count;
      $scope.videos = $scope.all[6].count;
      $scope.clients = $scope.all[7].count;
    });
  });
