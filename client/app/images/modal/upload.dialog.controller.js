'use strict';

/**
 * simplified version of images.dialog (single upload)
 */
angular.module('afrostreamAdminApp')
  .controller('ImagesUploadDialogCtrl', function ($scope, $cookies, $modalInstance, FileUploader, type) {
    var uploader = $scope.uploader = new FileUploader({
      url: 'api/images/?type='+type,
      queueLimit: 1
    });

    uploader.onBeforeUploadItem = function (item) {
      item.formData.push({dataType: item.file.dataType || 'poster'});
      item.headers = {
        'Authorization': 'Bearer ' + $cookies.get('token')
      };
    };

    uploader.onCompleteItem = function (item, response) {
      close(response);
    };

    var close = function () {
      $modalInstance.close();
      if (typeof $modalInstance.onClose === 'function') {
        $modalInstance.onClose.apply($modalInstance, arguments);
      }
    };
  });
