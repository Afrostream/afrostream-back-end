'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('categorys', {
        url: '/categorys',
        templateUrl: 'app/movies/movies.html',
        controller: 'MoviesCtrl',
        type: 'category'
      });
  });
