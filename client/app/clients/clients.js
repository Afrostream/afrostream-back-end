'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('clients', {
        url: '/clients',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'client',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty'
        }
      });
  });
