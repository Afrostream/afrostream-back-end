'use strict';

angular.module('afrostreamAdminApp')
  .controller('ImagesDialogCtrl', function ($scope, $sce, $log, $http, $modalInstance, item, type, Image, FileUploader) {

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

    uploader.onWhenAddingFileFailed = function (item /*{File|FileLikeObject}*/, filter, options) {
      $log.info('onWhenAddingFileFailed', item, filter, options);
    };
    uploader.onAfterAddingFile = function (fileItem) {
      $log.info('onAfterAddingFile', fileItem);
    };
    uploader.onAfterAddingAll = function (addedFileItems) {
      $log.info('onAfterAddingAll', addedFileItems);
    };
    uploader.onBeforeUploadItem = function (item) {
      $log.info('onBeforeUploadItem', item);
      item.formData.push({imgType: item.file.imgType});
      console.log(item.formData)
    };
    uploader.onProgressItem = function (fileItem, progress) {
      $log.info('onProgressItem', fileItem, progress);
    };
    uploader.onProgressAll = function (progress) {
      $log.info('onProgressAll', progress);
    };
    uploader.onSuccessItem = function (fileItem, response, status, headers) {
      $log.info('onSuccessItem', fileItem, response, status, headers);
    };
    uploader.onErrorItem = function (fileItem, response, status, headers) {
      $log.info('onErrorItem', fileItem, response, status, headers);
    };
    uploader.onCancelItem = function (fileItem, response, status, headers) {
      $log.info('onCancelItem', fileItem, response, status, headers);
    };
    uploader.onCompleteItem = function (fileItem, response, status, headers) {
      $log.info('onCompleteItem', fileItem, response, status, headers);
    };
    uploader.onCompleteAll = function () {
      $log.info('onCompleteAll');
    };

    $log.info('uploader', uploader);

  });
