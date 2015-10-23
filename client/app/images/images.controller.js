'use strict';

angular.module('afrostreamAdminApp')
  .controller('ImagesCtrl', function ($scope, $http, $modal, $state) {
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
          list: function () {
            return [];
          },
          type: function () {
            return 'image';
          }
        }
      },
      modalEditOpts = {
        templateUrl: 'app/modal/modal.html', // Url du template HTML
        controller: 'ImagesDialogCtrl',
        size: 'lg',
        scope: $scope,
        resolve: {
          item: function () {
            return $scope.currentItem;
          },
          list: function () {
            return [];
          },
          type: function () {
            return 'image';
          }
        }
      };

    $http.get(
      '/api/' + $scope.type + 's',
      {
        headers: {
          // @see https://www.npmjs.com/package/range-parser
          Range: 'items=0-10000'
        }
      }
    ).success(function (items) {
      $scope.items = items;
    });

    $scope.deleteItem = function (item) {
      $http.delete('/api/' + $scope.type + 's/' + item._id);
    };

    $scope.$on('$destroy', function () {
      //
    });

    $scope.editItem = function (item) {
      $scope.currentItem = item;
      $modal.open(modalEditOpts);
    };

    $scope.newItem = function () {
      $scope.currentItem = {};
      $modal.open(modalOpts);
    };
  });
