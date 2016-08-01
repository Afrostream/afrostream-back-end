'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('users', {
        url: '/users',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'user',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty' // unused
        }
      });
  });
