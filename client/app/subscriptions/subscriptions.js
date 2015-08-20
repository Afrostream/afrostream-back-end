'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('subscriptions', {
        url: '/subscriptions',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'subscription'
      });
  });
