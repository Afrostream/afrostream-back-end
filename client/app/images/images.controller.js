'use strict';

angular.module('afrostreamAdminApp')
  .controller('ImagesCtrl', function ($scope, $http, socket, $modal, $state) {
    $scope.type = $state.current.type || 'movie';
    $scope.items = [];
    $scope.currentItem = {};
    $scope.searchField = '';

    var modalOpts = {
      templateUrl: 'app/images/modal/images.html', // Url du template HTML
      controller: 'ImagesDialogCtrl',
      size: 'lg',
      scope: $scope,
      resolve: {
        item: function () {
          return $scope.currentItem;
        },
        type: function () {
          return $scope.type;
        }
      }
    };

    $http.get('/api/' + $scope.type + 's').success(function (items) {
      $scope.items = items;
      socket.syncUpdates($scope.type, $scope.items);
    });

    $scope.deleteItem = function (item) {
      $http.delete('/api/' + $scope.type + 's/' + item._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates($scope.type);
    });

    $scope.editItem = function (item) {
      $scope.currentItem = item;
      $modal.open(modalOpts);
    };

    $scope.newItem = function () {
      $scope.currentItem = {};
      $modal.open(modalOpts);
    };
  });
