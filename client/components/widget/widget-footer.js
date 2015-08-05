'use strict';

/**
 * Widget Footer Directive
 */

angular
  .module('afrostreamAdminApp')
  .directive('rdWidgetFooter', function () {
    return {
      requires: '^rdWidget',
      transclude: true,
      template: '<div class="widget-footer" ng-transclude></div>',
      restrict: 'E'
    };
  });
