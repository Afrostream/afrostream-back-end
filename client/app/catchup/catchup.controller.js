'use strict';

angular.module('afrostreamAdminApp')
  .controller('CatchupCtrl', function ($scope, $http, $modal) {
    $scope.movies = [];
    $scope.seasons = [];
    $scope.episodes = [];
    $scope.videos = [];

    $scope.activateIndex = function (item, type) {
      // hacky..
      item.active = !item.active;
      $http.put('/api/'+type+'s/' + item._id, item);
    };

    $scope.editIndex = function (item, type) {
      var modalOpts = {
        templateUrl: 'app/modal/modal.html', // Url du template HTML
        controller: 'ModalDialogCtrl',
        size: 'lg',
        scope: $scope,
        resolve: {
          item: function () {
            return item;
          },
          type: function () {
            return type;
          }
        }
      };
      var $uibModalInstance = $modal.open(modalOpts);
      $uibModalInstance.onClose = function (cancel) { if (!cancel) $scope.reload(); };
    };

    $scope.reload = function () {
      $scope.load();
    };

    $scope.load = function () {
      $http.get('/api/catchup/bet/movies').then(function (result) {
        $scope.movies = result.data.map(function (o) {
          o.expired = new Date(o.dateFrom) < new Date() && new Date(o.dateTo) > new Date();
          return o;
        });
      });
      $http.get('/api/catchup/bet/seasons').then(function (result) {
        $scope.seasons = result.data.map(function (o) {
          o.expired = new Date(o.dateFrom) < new Date() && new Date(o.dateTo) > new Date();
          return o;
        });
      });
      $http.get('/api/catchup/bet/episodes').then(function (result) {
        $scope.episodes = result.data.map(function (o) {
          o.expired = new Date(o.dateFrom) < new Date() && new Date(o.dateTo) > new Date();
          return o;
        });
      });
      $http.get('/api/catchup/bet/videos').then(function (result) {
        $scope.videos = result.data;
      });
    };

    $scope.load();
  });
