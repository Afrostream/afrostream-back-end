'use strict';

// factory returning a promise over genre list.
angular.module('afrostreamAdminApp')
  .factory('DataCountries', function ($http) {
    return $http.get('/api/countries/').then(function (countries) {
      return countries.data.map(function (country) { return country.name; });
    });
  });
