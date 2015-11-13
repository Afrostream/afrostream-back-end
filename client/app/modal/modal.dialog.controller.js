'use strict';

angular.module('afrostreamAdminApp')
  .controller('ModalDialogCtrl', function ($scope, $sce, $log, $http, $modalInstance, item, type, Slug, ngToast, Image) {
    // BEGIN temporary fix on dates...
    // should be generic & added to $httpProvider
    function parseItemDates(item) {
      if (typeof item.dateReleased !== 'undefined') {
        item.dateReleased = new Date(item.dateReleased);
      }
      return item;
    }

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

    $scope.genres = [
      'Action', //'Action',
      'Animation', //'Animation',
      'Aventure', //'Adventure',
      'Classique',
      'Comédie', //'Comedy',
      'Comédie dramatique',
      'Comédie familiale', // 'Family',
      'Concert',
      'Dessin animé',
      'Divers',
      'Documentaire', //'Documentary',
      'Drame', // 'Drama',
      'Epouvante',
      'Espionnage',
      'Expérimental',
      'Famille',
      'Fantastique', // 'Fantasy',
      'Guerre',
      'Historique',
      'Horreur',// 'Horror',
      'Jeunesse', //'Children',
      'Judiciaire',
      'LGBT',
      'Mini-Series', //'Mini-Series',
      'Musical',
      'Péplum',
      'Policier', //'Crime',
      'Romantique', // 'Romance',
      'Science-fiction', //'Sci-Fi',
      'Sport', // 'Sport',
      'Sport event',
      'Suspense', // 'Suspense',
      'Thriller', // 'Thriller'
      'Tv Show',
      'Western'
    ];

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

    $scope.getItem = function () {
      $scope.directiveType = (item.type || type) + 's';

      if (!item || !item._id) {
        $scope.item = item;
        $scope.item.type = item.type || type;
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
      }, function (err) {
        showError();
        $log.debug(err);
      });
    };

    //Load Item
    $scope.getItem();

    var showError = function () {
      ngToast.create({
        className: 'warning',
        content: 'API Error'
      });
    };

    //======= DATE =======//
    // Disable weekend selection
    $scope.disabled = function (date, mode) {
      return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    $scope.minDate = $scope.minDate ? null : new Date();

    $scope.open = function () {
      $scope.opened = true;
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
    };

    $scope.format = 'yyyy-MMMM-dd';

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
    }
  });
