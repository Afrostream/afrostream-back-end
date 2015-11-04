'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('jobs', {
        url: '/jobs',
        templateUrl: 'app/jobs/jobs.html',
        controller: 'JobsCtrl',
        type: 'job'
      });
  });