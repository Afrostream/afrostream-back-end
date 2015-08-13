'use strict';

angular.module('afrostreamAdminApp')
  .directive('licensors', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/licensors/licensors.html',
      controller: 'LicensorsCtrl'
    };
  });
