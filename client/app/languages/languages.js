'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('languages', {
        url: '/languages',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'language',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty' // unused
        }
      });
  });
