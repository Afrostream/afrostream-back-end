'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('episodes', {
        url: '/episodes',
        templateUrl: 'app/movies/movies.html',
        controller: 'MoviesCtrl',
        type: 'episode'
      });
  });
