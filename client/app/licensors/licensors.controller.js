'use strict';

angular.module('afrostreamAdminApp')
  .controller('LicensorsCtrl', function ($scope, Movie) {
    $scope.loadMovies = function (query) {
      return Movie.query({query: query}).$promise;
    }
  });
