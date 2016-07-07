'use strict';

angular.module('afrostreamAdminApp')
  .directive('widgets', function () {
    return {
      templateUrl: 'app/widgets/modal/widgets.html',
      restrict: 'E',
      controller: 'WidgetsDialogCtrl'
    };
  });
