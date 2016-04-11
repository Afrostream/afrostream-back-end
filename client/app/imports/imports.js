'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('imports', {
        url: '/imports',
        templateUrl: 'app/imports/imports.html',
        controller: 'ImportCtrl',
        type: 'import'
      });
  });