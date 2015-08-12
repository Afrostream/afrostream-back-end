'use strict';

angular.module('afrostreamAdminApp')
  .controller('SeasonsCtrl', function ($scope, $http, Movie, Episode) {
    $scope.loadEpisodes = function (query) {
      return Episode.query({query: query}).$promise;
    }
    $scope.loadMovies = function (query) {
      var p = Movie.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };
  });
