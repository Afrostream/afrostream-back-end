'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('videos', {
        url: '/videos',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'video',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty' // unused
        }
      });
  });
