'use strict';

angular.module('afrostreamAdminApp')
  .controller('ActorsCtrl', function ($scope, Image) {
    $scope.loadImages = function (query, param) {
      var p = Image.query({query: query, type: param}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };
  });
