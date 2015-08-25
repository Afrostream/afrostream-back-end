'use strict';

angular.module('afrostreamAdminApp')
  .directive('plans', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/plans/plans.html',
      controller: 'PlansCtrl'
    };
  });
