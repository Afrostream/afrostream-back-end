'use strict';

angular.module('afrostreamAdminApp')
  .controller('ModalDialogCtrl', function ($scope, $sce, $log, $http, $modalInstance, item, type, Slug, ngToast, Image) {

    $scope.item = item;

    $scope.item.type = $scope.item.type || type;

    $scope.directiveType = $scope.item.type + 's';

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
      $http.post('/api/' + $scope.directiveType, $scope.item).then(function (result) {
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
      $http.put('/api/' + $scope.directiveType + '/' + $scope.item._id, $scope.item).then(function (result) {
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
      $http.delete('/api/' + $scope.directiveType + '/' + $scope.item._id).then(function (result) {
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
      var p = Image.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };

  });
