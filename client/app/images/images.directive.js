'use strict';

angular.module('afrostreamAdminApp')
  .directive('images', function () {
    return {
      templateUrl: 'app/images/images.html',
      restrict: 'E',
      controller: 'ImagesCtrl'
    };
  });
