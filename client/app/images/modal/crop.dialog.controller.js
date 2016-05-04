'use strict';

/**
 * simplified version of images.dialog (single upload)
 */
angular.module('afrostreamAdminApp')
  .controller('ImagesCropDialogCtrl', function ($scope, $cookies, $modalInstance, image, ratio) {

    $scope.image = image;

    var rect = image[ratio] || '{}';
    if (rect) {
      rect = JSON.parse(rect);
    }

    $scope.area = rect;

    $scope.crop = function () {
      image[ratio] = JSON.stringify({
        x: Math.round($scope.cropject.cropImageLeft),
        y: Math.round($scope.cropject.cropImageTop),
        width: Math.round($scope.cropject.cropImageWidth),
        height: Math.round($scope.cropject.cropImageHeight)
      });
      close(true);
    };
    $scope.cancel = function () {
      close(true);
    };

    var close = function (cancel) {
      $modalInstance.close();
      if (typeof $modalInstance.onClose === 'function') {
        $modalInstance.onClose(cancel);
      }
    };
  });
