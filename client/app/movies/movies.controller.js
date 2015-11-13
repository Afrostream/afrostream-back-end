'use strict';

angular.module('afrostreamAdminApp')
  .controller('MoviesCtrl', function ($scope, Category, Season, Licensor, Video, Actor) {
    var hydrateActor = function (actor) {
      actor.fullName = actor.firstName + ' ' + actor.lastName;
    };

    if ($scope.modalHooks) {
      $scope.modalHooks.hydrateItem = function (item) {
        item.actors.forEach(hydrateActor);
        return item;
      };

    }

    $scope.loadCategorys = function (query) {
      return Category.query({query: query}).$promise;
    };
    $scope.loadSeasons = function (query) {
      return Season.query({query: query}).$promise;
    };
    $scope.loadLicensors = function (query) {
      return Licensor.query({query: query}).$promise;
    };
    $scope.isSerie = function () {
      if (!$scope.item) return false;
      return $scope.item.type === 'serie';
    };
    $scope.isMovie = function () {
      if (!$scope.item) return false;
      return $scope.item.type === 'movie';
    };
    $scope.loadVideo = function (query) {
      var p = Video.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };
    $scope.loadActors = function (query) {
      return Actor.query({query: query}).$promise.then(function (actors) {
        angular.forEach(actors, hydrateActor);
        return actors;
      });
    };
  })
;
