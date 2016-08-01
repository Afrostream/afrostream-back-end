'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('seasons', {
        url: '/seasons',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'season',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty' // unused
        }
      });
  });
