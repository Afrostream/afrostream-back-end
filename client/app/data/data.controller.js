'use strict';

angular.module('afrostreamAdminApp')
  .controller('DataCtrl', function ($scope, $log, $http, socket, $modal, $state) {
    $scope.type = $state.current.type || 'movie';
    $scope.items = [];
    $scope.currentItem = {};
    $scope.searchField = '';

    var modalOpts = {
      templateUrl: 'app/modal/modal.html', // Url du template HTML
      controller: 'ModalDialogCtrl',
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
    $scope.sortableOptions = {
      stop: function () {
        for (var index in $scope.items) {
          var item = $scope.items[index];
          if (item.sort !== index) {
            item.sort = index;
            $scope.updateIndex(item);
          }
        }
      }
    };

    $http.get('/api/' + $scope.type + 's').success(function (items) {
      $scope.items = items;
      $scope.items.sort(function (a, b) {
        return a.sort > b.sort;
      });
      socket.syncUpdates($scope.type, $scope.items);
    });

    $scope.updateIndex = function (item) {
      $http.put('/api/' + $scope.type + 's/' + item._id, item).then(function (result) {
      }, function (err) {
      });
    };

    $scope.deleteIndex = function (item) {
      $http.delete('/api/' + $scope.type + 's/' + item._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates($scope.type);
    });

    $scope.editIndex = function (item) {
      $scope.currentItem = item;
      $modal.open(modalOpts);
    };

    $scope.cloneIndex = function (item) {
      var copyItem = angular.copy(item);
      delete copyItem._id;
      if (copyItem.title) {
        copyItem.title = copyItem.title + '(clone)'
      }
      if (copyItem.name) {
        copyItem.name = copyItem.name + '(clone)'
      }
      if (copyItem.label) {
        copyItem.label = copyItem.label + '(clone)'
      }

      $http.post('/api/' + $scope.type + 's/', copyItem).then(function (result) {
      }, function (err) {
        $log.debug(err.statusText);
      });
    };

    $scope.newIndex = function () {
      $scope.currentItem = {};
      $modal.open(modalOpts);
    };

    $scope.hasThumb = function () {
      var hasTmb = true;
      switch ($scope.type) {
        case'licensor':
        case'category':
        case'language':
        case'client':
        case'video':
          hasTmb = false;
          break;
        default:
          break;
      }
      return hasTmb;
    }
  })
;
