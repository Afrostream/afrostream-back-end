'use strict';

angular.module('afrostreamAdminApp')
  .controller('EpisodesCtrl', function ($scope, Season) {
    $scope.loadSeasons = function (query) {
      var p = Season.query({query: query}).$promise;
      p.then(function (response) {
        return response.data;
      });
      return p;
    };
  });
