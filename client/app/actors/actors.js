'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('actors', {
        url: '/actors',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'actor',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty'
        }
      });
  });
