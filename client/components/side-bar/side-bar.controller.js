'use strict';

angular.module('afrostreamAdminApp')
  .controller('SidebarCtrl', function ($scope, Auth) {
    $scope.menu = [{
      'title': 'Dashboard',
      'state': 'main',
      'icon': 'fa-tachometer'
    }, {
      'title': 'Movies',
      'state': 'movies',
      'icon': 'fa-video-camera'
    }, {
      'title': 'Seasons',
      'state': 'seasons',
      'icon': 'fa-film'
    }, {
      'title': 'Users',
      'state': 'users',
      'icon': 'fa-users'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
  });
