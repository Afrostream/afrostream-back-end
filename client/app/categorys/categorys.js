'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('categorys', {
        url: '/categorys',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'category',
        resolve: {
          countries: 'DataEmpty',
          genres: 'DataEmpty'
        }
      });
  });
