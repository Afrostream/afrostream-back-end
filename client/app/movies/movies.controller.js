'use strict';

angular.module('afrostreamAdminApp')
  .controller('MoviesCtrl', function ($scope, Category, Season) {
    $scope.loadCategorys = function (query) {
      return Category.query({query: query}).$promise;
    }
    $scope.loadSeasons = function (query) {
      return Season.query({query: query}).$promise;
    }
  })
;
