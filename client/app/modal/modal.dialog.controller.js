'use strict';

angular.module('afrostreamAdminApp')
  .controller('ModalDialogCtrl', function ($scope, $sce, $log, $http, $modalInstance, item, type, Slug, ngToast) {

    $scope.item = item;

    $scope.item.type = type;

    $scope.slugify = function (input) {
      $scope.item.slug = Slug.slugify(input);
    };

    $scope.genres = ['Home', 'Action', 'Adventure', 'Animation', 'Children', 'Comedy',
      'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'Food',
      'Home and Garden', 'Horror', 'Mini-Series', 'Mystery', 'News', 'Reality',
      'Romance', 'Sci-Fi', 'Sport', 'Suspense', 'Talk Show', 'Thriller',
      'Travel',
      'New releases', 'Most popular', 'Tv series', 'American movies',
      'African movies', 'Caribbean movies', 'European movies', 'Documentaries', 'Kids'];

    $scope.typeaheadOpts = {
      minLength: 3,
      templateUrl: '/path/to/my/template.html',
      waitMs: 500,
      allowsEditable: true
    };

    $scope.cancel = function () {
      $modalInstance.close();
    };

    $scope.addItem = function () {
      $http.post('/api/' + type + 's', $scope.item).then(function (result) {
        ngToast.create({
          content: 'La ' + $scope.item.type + ' ' + result.data.title + ' à été ajoutée au catalogue'
        });
        $modalInstance.close();
      }, function (err) {
        showError();
        $log.debug(err.statusText);
      });
    };

    $scope.updateItem = function () {
      $http.put('/api/' + type + 's/' + $scope.item._id, $scope.item).then(function (result) {
        ngToast.create({
          content: 'La ' + $scope.item.type + ' ' + result.data.title + ' à été mise a jour'
        });
        $modalInstance.close();
      }, function (err) {
        showError();
        $log.debug(err.statusText);
      });
    };

    $scope.deleteItem = function () {
      $http.delete('/api/' + type + 's/' + $scope.item._id).then(function (result) {
        ngToast.create({
          content: 'La ' + $scope.item.type + ' ' + result.data.title + ' à été supprimée du catalogue'
        });
        $modalInstance.close();
      }, function (err) {
        showError();
        $log.debug(err.statusText);
      });
    };

    var showError = function () {
      ngToast.create({
        className: 'warning',
        content: 'Erreur lors de l\'ajout au catalogue '
      });
    };

    $scope.today = function () {
      $scope.dt = new Date();
    };
    $scope.today();

    $scope.clear = function () {
      $scope.dt = null;
    };

    // Disable weekend selection
    $scope.disabled = function (date, mode) {
      return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };

    $scope.toggleMin = function () {
      $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open = function () {
      $scope.opened = true;
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
    };

    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];

  });
