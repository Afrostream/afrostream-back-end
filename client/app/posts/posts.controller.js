'use strict';

angular.module('afrostreamAdminApp')
  .controller('PostsCtrl', function ($scope, Post) {
    $scope.loadPosts = function (query) {
      var p = Post.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };
  });
