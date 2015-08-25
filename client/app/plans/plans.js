'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('plans', {
        url: '/plans',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'plan'
      });
  });
