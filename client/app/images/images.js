'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('images', {
        url: '/images',
        templateUrl: 'app/images/images.html',
        controller: 'ImagesCtrl',
        type: 'image'
      });
  });
