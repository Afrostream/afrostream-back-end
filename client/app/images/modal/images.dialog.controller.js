'use strict';

angular.module('afrostreamAdminApp')
  .controller('ImagesDialogCtrl', function ($scope, $sce, $log, $http, $cookies, $modalInstance, item, list, type, Image, ngToast, FileUploader) {

    $scope.item = item;

    $scope.item.type = $scope.item.type || type;
    $scope.directiveType = type + 's';
    $scope.list = list || [];

    $scope.cancel = function () {
      $modalInstance.close();
    };

    $scope.updateItem = function () {
      $http.put('/api/' + $scope.directiveType + '/' + $scope.item._id, $scope.item).then(function (result) {
        ngToast.create({
          content: 'La ' + $scope.item.type + ' ' + result.data.title + ' à été Uploadé'
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
        content: 'Erreur lors de l\'ajout a aws '
      });
    };

    var uploader = $scope.uploader = new FileUploader({
      url: 'api/' + $scope.directiveType + '/'
    });

    // CALLBACKS
    uploader.onBeforeUploadItem = function (item) {
      item.formData.push({dataType: item.file.dataType || 'poster'});
      item.headers = {
        'Authorization': 'Bearer ' + $cookies.get('token')
      };
    };

    uploader.onCompleteItem = function (item, response) {
      $scope.list.push(response);
    };

  });
