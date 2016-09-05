'use strict';

angular.module('afrostreamAdminApp')
  .directive('works', function () {
    return {
      templateUrl: 'app/works/works.html',
      restrict: 'E',
      controller: 'WorksCtrl'
    };
  });
