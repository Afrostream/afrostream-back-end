'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('widgets', {
        url: '/widgets',
        templateUrl: 'app/widgets/widgets.html',
        controller: 'DataCtrl',
        type: 'widget',
        resolve: {
          genres: 'DataEmpty' // unused
        }
      });
  });
