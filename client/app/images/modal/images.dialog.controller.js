'use strict';

angular.module('afrostreamAdminApp')
  .controller('ImagesDialogCtrl', function ($scope, $sce, $log, $http, $cookies, $modalInstance, item, type, Image, ngToast, FileUploader) {

    $scope.item = item;

    $scope.item.type = $scope.item.type || type;
    $scope.directiveType = $scope.item.type + 's';

    $scope.cancel = function () {
      $modalInstance.close();
    };

    $scope.updateItem = function () {
      $http.put('/api/images/' + $scope.item._id, $scope.item).then(function (result) {
        ngToast.create({
          content: 'La ' + $scope.item.type + ' ' + result.data.title + ' à été mise a jour'
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

    var uploader = $scope.uploader = new FileUploader({
      url: 'api/images/'
    });

    // CALLBACKS
    uploader.onBeforeUploadItem = function (item) {
      item.formData.push({imgType: item.file.imgType});
      item.headers = {
        'Authorization': 'Bearer ' + $cookies.get('token')
      };
    };

  });
