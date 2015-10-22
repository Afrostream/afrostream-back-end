'use strict';

angular.module('afrostreamAdminApp')
  .filter('DataFormater', function () {
    return function (items) {
      items.forEach(function (item) {
        item.genericTitle = item.title
         || item.label
         || item.name
         || ((item.firstName || item.lastName) ? item.firstName + ' ' + item.lastName : '' )
        item.genericThumb = item.thumb || item.picture;
      });
      return items;
    };
 })
  .controller('DataCtrl', function ($scope, $log, $http, $modal, ngToast, $state, Modal) {
    var defaultPerPage = 30;

    $scope.type = $state.current.type || 'movie';
    $scope.items = [];
    $scope.itemsPerPage = defaultPerPage;
    $scope.totalItems = 0;
    $scope.currentItem = {};
    $scope.searchField = '';
    $scope.apiRessourceUrl = '/api/' + $scope.type + 's';
    $scope.apiParamsUrl = {
      query: $scope.searchField
    };
    $scope.pagination = {
      current: 1
    };
    $scope.pageChanged = function (newPage) {
      getResultsPage(newPage);
    };

    function getResultsPage(pageNumber) {
      // this is just an example, in reality this stuff should be in a service
      // FIXME: we shouldn't download everything
      var firstPage = 1;

      $http.get($scope.apiRessourceUrl, {
        params: {query: $scope.searchField},
        headers: angular.extend(
          {},
          $scope.headers,
          {
            // @see https://www.npmjs.com/package/range-parser
            Range: 'items='+((pageNumber - 1) * $scope.itemsPerPage) + '-' + ((pageNumber) * $scope.itemsPerPage)
          }
        )
      })
        .then(function (result) {
          $scope.items = result.data;
          $scope.totalItems = result.headers('Resource-Count') || result.data.length;
          $scope.numPages = Math.ceil($scope.totalItems / ($scope.itemsPerPage || defaultPerPage));
        });
    }

    getResultsPage(1);

    $scope.$watch('searchField', function (val) {
      if (!val) return;
      getResultsPage(1);
    });

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
      axis: 'y',
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

    $scope.updateIndex = function (item) {
      $http.put($scope.apiRessourceUrl + '/' + item._id, item).then(function (result) {
      }, function (err) {
      });
    };
    $scope.activateIndex = function (item) {
      item.active = !item.active;
      $http.put($scope.apiRessourceUrl + '/' + item._id, item).then(function (result) {
      }, function (err) {
      });
    };

    $scope.deleteIndex = Modal.confirm.delete(function (item) {
      $http.delete($scope.apiRessourceUrl + '/' + item._id);
    });

    $scope.$on('$destroy', function () {
      //
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

      $http.post($scope.apiRessourceUrl + '/', copyItem).then(function (result) {
      }, function (err) {
        $log.debug(err.statusText);
      });
    };

    $scope.newIndex = function () {
      $scope.currentItem = {};
      $modal.open(modalOpts);
    };

    $scope.importAlgolia = function () {
      $http.post($scope.apiRessourceUrl + '/algolia').then(function () {
        ngToast.create({
          content: 'Import algolia complet'
        });
      }, function (err) {
        ngToast.create({
          className: 'warning',
          content: 'API Error' + err.statusText
        });
        $log.debug(err.statusText);
      });
    };

    $scope.hasThumb = function () {
      var hasTmb = true;
      switch ($scope.type) {
        case'licensor':
        case'category':
        case'language':
        case'client':
        case'video':
        case'plan':
        case'user':
        case'subscription':
          hasTmb = false;
          break;
        default:
          break;
      }
      return hasTmb;
    }

    $scope.hasMail = function () {
      var hasTmb = false;
      switch ($scope.type) {
        case'user':
          hasTmb = true;
          break;
        default:
          break;
      }
      return hasTmb;
    }
  })
;
