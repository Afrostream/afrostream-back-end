'use strict';

angular.module('afrostreamAdminApp')
  .directive('categorys', function () {
    return {
      templateUrl: 'app/categorys/categorys.html',
      restrict: 'E',
      controller: 'CategorysCtrl'
    };
  });
