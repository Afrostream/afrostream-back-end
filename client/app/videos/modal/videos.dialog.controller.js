'use strict';

angular.module('afrostreamAdminApp')
  .controller('VideosDialogCtrl', function ($scope, $sce, $log, $http, $cookies, $modalInstance, item, ngToast, Digibos) {

    $scope.digibosSources = Digibos.query();

    $scope.selectVideo = function ($item, $model, $label) {
      return Digibos.get({id: $item.id}, function (data) {
        $scope.item = data.manifests;
      });
    };

    $scope.cancel = function () {
      $modalInstance.close();
    };

    $scope.addItem = function () {
    };

  });
