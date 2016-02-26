'use strict';

// factory returning a promise over genre list.
angular.module('afrostreamAdminApp')
  .factory('DataGenres', function ($http) {
    return $http.get('/api/genres/').then(function (genres) {
      return genres.data.map(function (genre) { return genre.name; });
    });
  });
