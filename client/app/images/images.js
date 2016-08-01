'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('images', {
        url: '/images',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'image',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty' // unused
        }
      });
  });
