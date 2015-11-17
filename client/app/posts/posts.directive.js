'use strict';

angular.module('afrostreamAdminApp')
  .directive('posts', function () {
    return {
      templateUrl: 'app/posts/posts.html',
      restrict: 'E',
      controller: 'PostsCtrl'
    };
  });
