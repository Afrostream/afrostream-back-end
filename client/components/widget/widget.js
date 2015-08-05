'use strict';
/**
 * Widget Directive
 */

angular
  .module('afrostreamAdminApp')
  .directive('rdWidget', function () {
    return {
      transclude: true,
      template: '<div class="widget" ng-transclude></div>',
      restrict: 'EA'
    };
  });
