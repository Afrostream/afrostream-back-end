'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('movies', {
        url: '/movies',
        templateUrl: 'app/movies/movies.html',
        controller: 'MoviesCtrl'
      });
  });