'use strict';

angular.module('afrostreamAdminApp')
  .controller('VideosDialogCtrl', function ($scope, $sce, $log, $http, $cookies, $uibModalInstance, item, ngToast, Mam, FileUploader) {

    $scope.mamSources = Mam.query();
    $scope.selectedItemId = null;
    $scope.importEnabled = true;

    $scope.selectVideo = function ($item) {
      $scope.selectedItemId = $item.id;
    };

    $scope.import = function () {
      $scope.importEnabled = false;
      $http.post('/api/mam/import', { id: $scope.selectedItemId })
        .then(function (result) {
          $scope.selectedItemId = null;
          ngToast.create({
            content: 'La video' + result.data.name + ' à été ajoutée au catalogue'
          });
          $uibModalInstance.close();
        }, function (err) {
          $scope.selectedItemId = null;
          $scope.importEnabled = true;
          $log.debug(err);
        });
    };

    $scope.importAll = function () {
      $scope.importEnabled = false;
      $http.post('/api/mam/importAll').then(function () {
        ngToast.create({
          content: 'Les videos ont été ajoutées au catalogue'
        });
        $uibModalInstance.close();
      }, function (err) {
        $scope.importEnabled = true;
        $log.debug(err);
      });
    };

    $scope.cancel = function () {
      $uibModalInstance.close();
    };
  });
