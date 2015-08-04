'use strict';

angular.module('afrostreamAdminApp')
  .controller('MovieDialogCtrl', function ($scope, $sce, $log, $http, $modalInstance, movie, Movie, Slug) {

    $scope.movie = movie;

    $scope.slugify = function (input) {
      $scope.movie.slug = Slug.slugify(input);
    };

    /**
     * Recuper les infos via ws afin de determiner si la video est deja en base
     * pour create/update
     */
    Movie.getInfo({id: movie._id || 0}, function (movie) {
    }, function () {
    });

    $scope.genres = ['Home', 'Action', 'Adventure', 'Animation', 'Children', 'Comedy',
      'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Food',
      'Home and Garden', 'Horror', 'Mini-Series', 'Mystery', 'News', 'Reality',
      'Romance', 'Sci-Fi', 'Sport', 'Suspense', 'Talk Show', 'Thriller',
      'Travel',
      'New releases', 'Most popular', 'Tv series', 'American movies',
      'African movies', 'Caribbean movies', 'European movies', 'Documentaries', 'Kids'];

    $scope.typeaheadOpts = {
      minLength: 3,
      templateUrl: '/path/to/my/template.html',
      waitMs: 500,
      allowsEditable: true
    };

    $scope.cancel = function () {
      $modalInstance.close();
    };

    $scope.addMovie = function () {
      $http.post('/api/movies', $scope.movie).then(function (result) {
        $modalInstance.close();
      }, function (err) {
        $log.debug(err.statusText);
      });
    };

    $scope.updateMovie = function () {
      $http.put('/api/movies/' + $scope.movie._id, $scope.movie).then(function (result) {
        $modalInstance.close();
      }, function (err) {
        $log.debug(err.statusText);
      });
    };

    $scope.deleteMovie = function () {
      $http.delete('/api/movies/' + $scope.movie._id).then(function () {
        $modalInstance.close();
      }, function (err) {
        $log.debug(err.statusText);
      });
    };

  });
