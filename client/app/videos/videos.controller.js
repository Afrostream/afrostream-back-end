'use strict';

angular.module('afrostreamAdminApp')
  .controller('VideosCtrl', function ($scope, Asset, Caption, Lang) {

    $scope.languages = Lang.query();

    $scope.formats = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'application/dash+xml'
    ];

    $scope.item.sources = $scope.item.sources || [];
    $scope.item.captions = $scope.item.captions || [];

    $scope.newAsset = function (data) {
      Asset.save().$promise.then(function (item) {
        data.push(item);
      });
    };
    $scope.saveAsset = function (asset) {
      Asset.update(asset);
    };

    $scope.removeAsset = function (asset, $index) {
      if (asset._id) {
        Asset.remove({id: asset._id}).$promise.then(function () {
          $scope.item.sources.splice($index, 1);
        });
      } else {
        $scope.item.sources.splice($index, 1);
      }
    };

    $scope.newCaption = function (data) {
      Caption.save().$promise.then(function (item) {
        data.push(item);
      });
    };
    $scope.saveCaption = function (caption) {
      Caption.update(caption);
    };

    $scope.removeCaption = function (caption, $index) {
      if (caption._id) {
        Caption.remove({id: caption._id}).$promise.then(function () {
          $scope.item.captions.splice($index, 1);
        });
      } else {
        $scope.item.captions.splice($index, 1);
      }
    };

  });
