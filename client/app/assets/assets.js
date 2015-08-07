'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('assets', {
        url: '/assets',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'asset'
      });
  });
