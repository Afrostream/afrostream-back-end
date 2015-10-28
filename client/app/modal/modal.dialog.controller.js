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
      close(true);
    };

    $scope.addItem = function () {
      $http.post('/api/' + $scope.directiveType, $scope.item).then(function (result) {
        ngToast.create({
          content: 'L\'objet ' + type + ' ' + getTitle(result.data) + ' à été ajoutée au catalogue'
        });
        close();
      }, function (err) {
        showError();
        $log.debug(err);
      });
    };

    $scope.updateItem = function () {
      $http.put('/api/' + $scope.directiveType + '/' + $scope.item._id, $scope.item).then(function (result) {
        console.log($scope.item);
        console.log(result.data);
        ngToast.create({

          content: 'L\'objet  ' + type + ' ' + getTitle(result.data) + ' à été mise a jour'
        });
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
        $scope.item = parseItemDates(result.data);
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
