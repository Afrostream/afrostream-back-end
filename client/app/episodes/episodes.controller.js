'use strict';

angular.module('afrostreamAdminApp')
  .controller('EpisodesCtrl', function ($scope, Season, Video) {
    $scope.loadSeasons = function (query) {
      var p = Season.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };

    $scope.loadVideo = function (query) {
      var p = Video.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };
  });
