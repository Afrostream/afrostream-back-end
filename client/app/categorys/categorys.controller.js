'use strict';

angular.module('afrostreamAdminApp')
  .controller('CategorysCtrl', function ($scope, Movie) {
    $scope.maxAdSpots = 5;
    $scope.loadMovies = function (query) {
      return Movie.query({query: query}).$promise;
    };


    //// COUNTRIES ////
    var updateScopeCountriesProps = function () {
      $scope.countriesProps = {
        countries : $scope.item && $scope.item.countries || [],
        onChange: function (countries) {
          $scope.item.countries = countries;
        }
      };
    }
    updateScopeCountriesProps();
    $scope.$watch('item', updateScopeCountriesProps);

    //// BROADCASTERS ///
    var updateScopeBroadcastersProps = function () {
      $scope.broadcastersProps = {
        broadcasters : $scope.item && $scope.item.broadcasters || [],
        onChange: function (broadcasters) {
          $scope.item.broadcasters = broadcasters;
        }
      };
    }
    updateScopeBroadcastersProps();
    $scope.$watch('item', updateScopeBroadcastersProps);
  })
;
