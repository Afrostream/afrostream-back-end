'use strict';

/**
 * simplified version of images.dialog (single upload)
 */
angular.module('afrostreamAdminApp')
  .controller('ImagesCropDialogCtrl', function ($scope, $cookies, $http, $uibModalInstance, $log, ngToast, image, ratio) {

    $scope.image = image;
    $scope.area = image[ratio] || {};

    $scope.crop = function () {
      var profiles = image.profiles || {};
      if (profiles) {

        profiles[ratio] = {
          x: Math.round($scope.cropject.cropImageLeft),
          y: Math.round($scope.cropject.cropImageTop),
          width: Math.round($scope.cropject.cropImageWidth),
          height: Math.round($scope.cropject.cropImageHeight)
        };

        image.profiles = profiles;
      }

      $http.put('/api/images/' + image._id, image).then(function (result) {
        ngToast.create({
          content: 'Le profile image ' + result.data._id + ' à été mis a jour'
        });
        $uibModalInstance.close();
      }, function (err) {
        showError();
        $log.debug(err.statusText);
      });

    };

    $scope.cancel = function () {
      $uibModalInstance.close();
    };
  });
