'use strict';

angular.module('afrostreamAdminApp')
  .directive('seasons', function () {
    return {
      templateUrl: 'app/seasons/seasons.html',
      restrict: 'E',
      controller: 'SeasonsCtrl'
    };
  });
