'use strict';

angular.module('afrostreamAdminApp')
  .controller('NavbarCtrl', function ($scope, Auth) {
    $scope.menu = [{
      'title': 'Dashboard',
      'state': 'main',
      'icon': 'fa-tachometer'
    }, {
      'title': 'Movies',
      'state': 'movies',
      'icon': 'fa-video-camera'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
  });
