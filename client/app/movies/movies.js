'use strict';

angular.module('afrostreamAdminApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('movies', {
        url: '/movies',
        templateUrl: 'app/data/data.html',
        controller: 'DataCtrl',
        type: 'movie',
        resolve: {
          countries: 'DataCountries',
          genres: 'DataGenres'
        }
      });
  });
