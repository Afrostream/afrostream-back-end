'use strict';

angular.module('afrostreamAdminApp')
  .directive('movies', function () {
    return {
      templateUrl: 'app/movies/movies.html',
      restrict: 'E',
      controller: 'MoviesCtrl'
    };
  });
