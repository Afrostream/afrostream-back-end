'use strict';

angular.module('afrostreamAdminApp')
  .directive('episodes', function () {
    return {
      templateUrl: 'app/episodes/episodes.html',
      restrict: 'E',
      controller: 'EpisodesCtrl'
    };
  });
