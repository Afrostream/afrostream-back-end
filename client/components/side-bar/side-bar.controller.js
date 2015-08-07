'use strict';

angular.module('afrostreamAdminApp')
  .controller('SidebarCtrl', function ($scope, Auth) {
    $scope.menu = [{
      'title': 'Dashboard',
      'state': 'main',
      'icon': 'fa-tachometer'
    }, {
      'title': 'Categorys',
      'state': 'categorys',
      'icon': 'fa-bookmark'
    }, {
      'title': 'Movies',
      'state': 'movies',
      'icon': 'fa-video-camera'
    }, {
      'title': 'Seasons',
      'state': 'seasons',
      'icon': 'fa-film'
    }, {
      'title': 'Episodes',
      'state': 'episodes',
      'icon': 'fa-ticket'
    }, {
      'title': 'Assets',
      'state': 'assets',
      'icon': 'fa-file-video-o'
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
