'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('works', {
        url: '/works',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'work',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty' // unused
        }
      });
  });
