'use strict';

angular.module('afrostreamAdminApp')
  .controller('SeasonsCtrl', function ($scope, $http, Movie, Episode) {
    $scope.autoEpisodes = false;
    $scope.loadEpisodes = function (query) {
      return Episode.query({query: query}).$promise;
    }
    $scope.loadMovies = function (query) {
      return Movie.query({query: query}).$promise;
    };
  });
