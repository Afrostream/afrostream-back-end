'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('configs', {
        url: '/configs',
        templateUrl: 'app/configs/configs.html',
        controller: 'DataCtrl',
        type: 'config',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty' // unused
        }
      });
  });
