'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('seasons', {
        url: '/seasons',
        templateUrl: 'app/movies/movies.html',
        controller: 'MoviesCtrl',
        type: 'season'
      });
  });
