'use strict';

angular.module('afrostreamAdminApp')
  .controller('MoviesCtrl', function ($scope, $http, socket, $modal) {
    $scope.movies = [];
    $scope.currentMovie = {};

    var movieModalOpts = {
      templateUrl: 'app/movies/modal/movie.html', // Url du template HTML
      controller: 'MovieDialogCtrl',
      scope: $scope,
      resolve: {
        movieList: function () {
          return $scope.movies;
        }, movie: function () {
          return $scope.currentMovie;
        }
      }
    };

    $http.get('/api/movies').success(function (movies) {
      $scope.movies = movies;
      socket.syncUpdates('movie', $scope.movies);
    });

    $scope.deleteMovie = function (movie) {
      $http.delete('/api/movies/' + movie._id);
    };


    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('movie');
    });

    $scope.editMovie = function (movie) {
      $scope.currentMovie = movie;
      $modal.open(movieModalOpts);
    };

    $scope.newMovie = function () {
      $scope.currentMovie = {};
      $modal.open(movieModalOpts);
    };
  });
