'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('assets', {
        url: '/assets',
        templateUrl: 'app/assets/assets.html',
        controller: 'AssetsCtrl'
      });
  });