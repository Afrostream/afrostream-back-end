'use strict';

angular.module('afrostreamAdminApp')
  .controller('EpisodesCtrl', function ($scope, Season, Video) {
    $scope.$watch('item.episodeNumber', function() {
      if ($scope.item) {
        $scope.item.sort = $scope.item.episodeNumber;
      }
    }, true);

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
