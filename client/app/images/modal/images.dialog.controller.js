'use strict';

angular.module('afrostreamAdminApp')
  .controller('ImagesDialogCtrl', function ($scope, $sce, $log, $http, $cookies, $modalInstance, item, type, Image, FileUploader) {

    $scope.item = item;

    $scope.item.type = $scope.item.type || type;
    $scope.directiveType = $scope.item.type + 's';

    $scope.cancel = function () {
      $modalInstance.close();
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
