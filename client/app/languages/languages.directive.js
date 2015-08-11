'use strict';

angular.module('afrostreamAdminApp')
  .directive('languages', function () {
    return {
      templateUrl: 'app/languages/languages.html',
      restrict: 'E',
      controller: 'LanguagesCtrl'
    };
  });
