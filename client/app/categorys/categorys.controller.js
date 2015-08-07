'use strict';

angular.module('afrostreamAdminApp')
  .controller('CategorysCtrl', function ($scope, Movie) {
    $scope.loadMovies = function (query) {
      return Movie.query({query: query}).$promise;
    }
  })
;
