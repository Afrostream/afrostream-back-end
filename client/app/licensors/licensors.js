'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('licensors', {
        url: '/licensors',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'licensor',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty' // unused
        }
      });
  });
