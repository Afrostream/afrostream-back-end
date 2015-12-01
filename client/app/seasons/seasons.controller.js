'use strict';

angular.module('afrostreamAdminApp')
  .controller('SeasonsCtrl', function ($scope, $http, Movie, Episode) {
    $scope.$watch('item.seasonNumber', function() {
      if ($scope.item) {
        $scope.item.sort = $scope.item.seasonNumber;
      }
    }, true);

    $scope.autoEpisodes = false;
    $scope.loadEpisodes = function (query) {
      return Episode.query({query: query}).$promise;
    };
    $scope.loadMovies = function (query) {
      return Movie.query({query: query}).$promise;
    };
  });
