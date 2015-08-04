'use strict';

angular.module('afrostreamAdminApp')
  .controller('MovieDialogCtrl', function ($scope, $sce, $log, $http, $modalInstance, movie, Movie) {

    $scope.movie = movie;
    $scope.imageList = [];

    /**
     * Recuper les infos via ws afin de determiner si la video est deja en base
     * pour create/update
     */
    Movie.getInfo({id: movie._id || 0}, function (movie) {
      $scope.searchImage(movie.title);
      $scope.added = true;
    }, function () {
      $scope.added = false;
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

    $scope.sourceList = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'application/dash+xml'
    ];

    $scope.$watch('searchImg', function (title) {
      if (!title) {
        return;
      }
      $scope.searchImage(title);
    });

    $scope.cancel = function () {
      $modalInstance.close();
    };


    $scope.removePreview = function (index) {
      $scope.movie.preview.splice(index, 1);
    };

    $scope.addPreview = function () {
      $scope.movie.preview = $scope.movie.preview || [];
      $scope.movie.preview.push({src: 'http://www.videogular.com/assets/videos/videogular.mp4', type: 'video/mp4'});
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

        angular.forEach($scope.movies, function (u, i) {
          if (u === $scope.movie) {
            $scope.movies.splice(i, 1);
          }
        });

        $modalInstance.close();
      }, function (err) {
        $log.debug(err.statusText);
      });
    };

    $scope.selectImage = function (image) {
      $scope.movie.poster = image.url;
    };

    $scope.searchImage = function (search) {
      $http.get('/api/images/' + search).then(function (result) {
        $scope.imageList = result.data;
      }, function (err) {
        $log.debug(err.statusText);
      });
    };

  });
