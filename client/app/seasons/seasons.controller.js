'use strict';

angular.module('afrostreamAdminApp')
  .controller('SeasonsCtrl', function ($scope, $http, Movie, Episode) {
    $scope.loadEpisodes = function (query) {
      return Episode.query({query: query}).$promise;
    }
    $scope.loadMovies = function (query) {
      console.log(query)
      return Movie.query({query: query}).$promise;
    };
  });
