'use strict';

angular.module('afrostreamAdminApp')
  .controller('SeasonsCtrl', function ($scope, $http, Season, Episode) {
    $scope.loadEpisodes = function (query) {
      return Episode.query({query: query}).$promise;
    }
  });
