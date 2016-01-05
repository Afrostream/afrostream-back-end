'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('catchup', {
        url: '/catchup',
        templateUrl: 'app/catchup/catchup.html',
        controller: 'CatchupCtrl',
        type: 'catchup'
      });
  });