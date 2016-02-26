'use strict';

angular.module('afrostreamAdminApp')
  .directive('images', function () {
    return {
      templateUrl: 'app/images/item.html',
      restrict: 'E',
      controller: 'ImagesCtrl'
    };
  });
