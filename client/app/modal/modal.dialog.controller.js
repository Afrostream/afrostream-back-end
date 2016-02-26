'use strict';

angular.module('afrostreamAdminApp')
  .controller('ModalDialogCtrl', function ($scope, $sce, $log, $http, $modalInstance, item, type, Slug, ngToast, Image, $timeout, $modal) {
    // BEGIN temporary fix on dates...
    // should be generic & added to $httpProvider
    function parseItemDates(item) {
      if (item.dateReleased) {
        item.dateReleased = new Date(item.dateReleased);
      }
      return item;
    }

    $scope.modalType = type;

    $scope.modalHooks = {};

    var getTitle = function (item) {
      return item.title || item.label || item.name || ((item.firstName || item.lastName) ? item.firstName + ' ' + item.lastName : '' );
    };

    $scope.isFilm = function () {
      return type === 'movie' || type === 'serie';
    };
    $scope.isSeason = function () {
      return type === 'season';
    };
    $scope.isEpisode = function () {
      return type === 'episode';
    };

    $scope.slugify = function (input) {
      $scope.item.slug = Slug.slugify(input);
    };

    $scope.typeaheadOpts = {
      minLength: 3,
      templateUrl: '/path/to/my/template.html',
      waitMs: 500,
      allowsEditable: true
    };

    $scope.cancel = function () {
      close(true);
    };

    $scope.addItem = function () {
      if (typeof $scope.modalHooks.beforeAdd === 'function') {
        $scope.modalHooks.beforeAdd();
      }
      $http.post('/api/' + $scope.directiveType, $scope.item).then(function (result) {
        ngToast.create({
          content: 'L\'objet ' + type + ' ' + getTitle(result.data) + ' à été ajoutée au catalogue'
        });
        if (typeof $scope.modalHooks.afterAdd === 'function') {
          $scope.modalHooks.afterAdd(result.data);
        }
        close();
      }, function (err) {
        showError();
        $log.debug(err);
      });
    };

    $scope.updateItem = function () {
      if (typeof $scope.modalHooks.beforeUpdate === 'function') {
        $scope.modalHooks.beforeUpdate();
      }
      $http.put('/api/' + $scope.directiveType + '/' + $scope.item._id, $scope.item).then(function (result) {
        ngToast.create({
          content: 'L\'objet  ' + type + ' ' + getTitle(result.data) + ' à été mise a jour'
        });
        if (typeof $scope.modalHooks.afterUpdate === 'function') {
          $scope.modalHooks.afterUpdate(result.data);
        }
        close();
      }, function (err) {
        showError();
        $log.debug(err);
      });
    };

    $scope.deleteItem = function () {
      $http.delete('/api/' + $scope.directiveType + '/' + $scope.item._id).then(function (result) {
        ngToast.create({
          content: 'L\'objet  ' + type + ' ' + getTitle(result.data) + ' à été supprimée du catalogue'
        });
        close();
      }, function (err) {
        showError();
        $log.debug(err);
      });
    };

    $scope.uploadPoster = function () {
      var m = $modal.open({
        templateUrl: 'app/images/modal/upload.html',
        controller: 'ImagesUploadDialogCtrl',
        size: 'lg',
        scope: $scope,
        resolve: {
          type: function () {
            return 'poster';
          }
        }
      });
      m.onClose = function (image) {
        if (image) {
          $scope.item.poster = image;
        }
      };
    };

    $scope.uploadThumb = function () {
      var m = $modal.open({
        templateUrl: 'app/images/modal/upload.html',
        controller: 'ImagesUploadDialogCtrl',
        size: 'lg',
        scope: $scope,
        resolve: {
          type: function () {
            return 'thumb';
          }
        }
      });
      m.onClose = function (image) {
        if (image) {
          $scope.item.thumb = image;
        }
      };
    };

    $scope.getItem = function () {
      $scope.directiveType = type + 's';

      if (!item || !item._id) {
        return;
      }
      $http.get('/api/' + $scope.directiveType + '/' + item._id, { params : { backo: 1} }).then(function (result) {
        // FIXME: network code inside modal/* data/* should be in a single place
        //  & user $httpProvider to filter dates..
        var item = result.data;
        if (typeof $scope.modalHooks.hydrateItem === 'function') {
          item = $scope.modalHooks.hydrateItem(item);
        }
        $scope.item = parseItemDates(item);
        // fixme: horrible...
        if (typeof $scope.modalHooks.onItemLoaded === 'function') {
          $scope.modalHooks.onItemLoaded();
        }
      }, function (err) {
        showError();
        $log.debug(err);
      });
    };

    var showError = function () {
      ngToast.create({
        className: 'warning',
        content: 'API Error'
      });
    };

    //======= DATE =======//
    $scope.disabled = function (date, mode) {
      return false; // ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    //
    $scope.minDate = $scope.minDate ? null : new Date();
    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
    };

    $scope.format = 'yyyy-MM-dd';

    $scope.loadImages = function (query, param) {
      var p = Image.query({query: query, type: param}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };

    var close = function (cancel) {
      $modalInstance.close();
      if (typeof $modalInstance.onClose === 'function') {
        $modalInstance.onClose(cancel);
      }
    };

    // getItem is often triggered before modal hooks are binded (directives aren't yet loaded)
    //  so this timeout is a quick fix & not the proper way of mitigating the pb
    $timeout(function () {
      $scope.getItem();
    }, 100);
  });
