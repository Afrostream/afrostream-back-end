'use strict';

angular.module('afrostreamAdminApp')
  .controller('MoviesCtrl', function ($scope, Category, Season, Licensor) {
    $scope.loadCategorys = function (query) {
      return Category.query({query: query}).$promise;
    }
    $scope.loadSeasons = function (query) {
      return Season.query({query: query}).$promise;
    }
    $scope.loadLicensors = function (query) {
      return Licensor.query({query: query}).$promise;
    }
    $scope.isSerie = function () {
      return $scope.item.type === 'serie';
    };
    $scope.isMovie = function () {
      return $scope.item.type === 'movie';
    };
  })
;
