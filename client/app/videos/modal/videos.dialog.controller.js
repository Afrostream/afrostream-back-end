'use strict';

angular.module('afrostreamAdminApp')
  .controller('VideosDialogCtrl', function ($scope, $sce, $log, $http, $cookies, $modalInstance, item, ngToast, Digibos, FileUploader) {

    $scope.digibosSources = Digibos.query();
    $scope.selectedItem = null;
    $scope.importEnabled = true;

    $scope.selectVideo = function ($item) {
      return Digibos.get({id: $item.id}, function (data) {
        data.importId = data.id;
        data.name = data.title;
        data.encodingId = data.uuid;
        angular.forEach(data.manifests, function (value) {
          delete value.id;
          angular.extend(value, $scope.extractType(value));
        });
        data.sources = data.manifests;
        data.drm = Boolean(data.drm);
        $scope.selectedItem = data;
      });
    };

    $scope.allFromLudobos = function () {
      $scope.importEnabled = false;
      $http.post('/api/digibos/all', $scope.selectedItem).then(function () {
        ngToast.create({
          content: 'Les videos ont été ajoutées au catalogue'
        });
        $modalInstance.close();
      }, function (err) {
        $scope.importEnabled = true;
        $log.debug(err);
      });
    };

    $scope.extractMime = function (filename) {
      var reg = /(\/[^?]+).*/;
      var filePath = filename.match(reg);

      var parts = filePath[1].split('.');
      var type = (parts.length > 1) ? parts.pop() : 'mp4';
      return type;
    };

    $scope.replaceType = function (filename, replacement) {
      var type = $scope.extractMime(filename);
      var newFile = filename.replace(type, replacement);
      return newFile;
    };

    $scope.extractType = function (value) {
      var type = $scope.extractMime(value.url);
      var rtType = {};
      switch (type) {
        case 'm3u8':
          rtType.type = 'application/vnd.apple.mpegurl';
          rtType.format = 'hls';
          break;
        case 'mpd':
          rtType.type = 'application/dash+xml';
          rtType.format = 'mpd';
          break;
        case 'f4m':
          rtType.type = 'application/adobe-f4m';
          rtType.format = 'hds';
          break;
        default:
          rtType.type = 'video/' + type;
          rtType.format = 'progressive';
          break;
      }

      rtType.importId = value.content_id;
      rtType.src = value.url;
      return rtType;
    };

    $scope.addVideo = function () {
      delete $scope.selectedItem.id;
      $http.post('/api/videos/', $scope.selectedItem).then(function (result) {
        ngToast.create({
          content: 'La video' + result.data.name + ' à été ajoutée au catalogue'
        });
        $modalInstance.close();
      }, function (err) {
        $log.debug(err);
      });
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.close();
    };

    $scope.addItem = function () {
    };

  });
