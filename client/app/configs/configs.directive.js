'use strict';

angular.module('afrostreamAdminApp')
  .directive('configs', function () {
    return {
      templateUrl: 'app/configs/modal/configs.html',
      restrict: 'E',
      controller: 'ConfigsDialogCtrl'
    };
  });
