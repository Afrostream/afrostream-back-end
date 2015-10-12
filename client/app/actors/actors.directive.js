'use strict';

angular.module('afrostreamAdminApp')
  .directive('actors', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/actors/actors.html',
      controller: 'ActorsCtrl'
    };
  });
