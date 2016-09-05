'use strict';

angular.module('afrostreamAdminApp')
  .controller('WorksCtrl', function ($scope, Work) {
    $scope.loadWorks = function (query) {
      var p = Work.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };
  });
