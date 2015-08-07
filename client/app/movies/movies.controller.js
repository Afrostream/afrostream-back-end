'use strict';

angular.module('afrostreamAdminApp')
  .controller('MoviesCtrl', function ($scope, Category) {
    $scope.loadCategorys = function (query) {
      return Category.query({query: query}).$promise;
    }
  })
;
