'use strict';

angular.module('afrostreamAdminApp')
  .controller('MainCtrl', function ($scope, $http, socket, Licensor, User, Movie, Category, Season, Episode, Video) {
    $scope.licensors = Licensor.query();
    $scope.categorys = Category.query();
    $scope.seasons = Season.query();
    $scope.episodes = Episode.query();
    $scope.movies = Movie.query();
    $scope.videos = Video.query();
    $scope.users = User.query();
  });
