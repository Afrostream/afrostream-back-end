'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('episodes', {
        url: '/episodes',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'episode',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty'
        }
      });
  });
