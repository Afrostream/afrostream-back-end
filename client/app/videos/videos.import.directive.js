'use strict';

angular.module('afrostreamAdminApp')
  .directive('videosImport', function () {
    return {
      templateUrl: 'app/videos/videos-import.html',
      restrict: 'E',
      controller: 'VideosCtrl'
    };
  });
