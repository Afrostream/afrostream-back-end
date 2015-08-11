'use strict';

angular.module('afrostreamAdminApp')
  .directive('videos', function () {
    return {
      templateUrl: 'app/videos/videos.html',
      restrict: 'E',
      controller: 'VideosCtrl'
    };
  });
