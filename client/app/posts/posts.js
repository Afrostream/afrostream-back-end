'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('posts', {
        url: '/posts',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'post',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty' // unused
        }
      });
  });
