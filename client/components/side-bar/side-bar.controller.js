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
      'title': 'Catchup',
      'state': 'catchup',
      'icon': 'fa-tv'
    }, {
      'title': 'Licensors',
      'state': 'licensors',
      'icon': 'fa-trophy'
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
      'title': 'Videos',
      'state': 'videos',
      'icon': 'fa-file-video-o'
    }, {
      'title': 'Languages',
      'state': 'languages',
      'icon': 'fa-globe'
    }, {
      'title': 'Images',
      'state': 'images',
      'icon': 'fa-picture-o'
    }, {
      'title': 'Actors',
      'state': 'actors',
      'icon': 'fa-female'
    }, {
      'title': 'Users',
      'state': 'users',
      'icon': 'fa-users'
    }, {
      'title': 'Plans',
      'state': 'plans',
      'icon': 'fa-cc-mastercard'
    }, {
      'title': 'Subscriptions',
      'state': 'subscriptions',
      'icon': 'fa-credit-card'
    }, {
      'title': 'Clients',
      'state': 'clients',
      'icon': 'fa-user-secret'
    }, {
      'title': 'Jobs',
      'state': 'jobs',
      'icon': 'fa-clock-o'
    }, {
      'title': 'Posts',
      'state': 'posts',
      'icon': 'fa-newspaper-o'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
  });
