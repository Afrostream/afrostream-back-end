'use strict';

angular.module('afrostreamAdminApp')
  .controller('VideosCtrl', function ($scope, $log, $http, $modal, Asset, Caption, Lang) {

    $scope.languages = Lang.query();

    $scope.formats = [
      'video/mp4',
      'video/dash',
      'video/webm',
      'video/ogg',
      'application/vnd.apple.mpegurl',
      'application/dash+xml'
    ];

    $scope.$watch('item', function () {
      if (!$scope.item) return;
      $scope.item.sources = $scope.item.sources || [];
      $scope.item.captions = $scope.item.captions || [];
    });

    $scope.newElemFromLudobos = function (data) {
      $modal.open({
        templateUrl: 'app/videos/modal/videos.html', // Url du template HTML
        controller: 'VideosDialogCtrl',
        size: 'lg',
        scope: $scope,
        resolve: {
          item: function () {
            return data;
          }
        }
      });
    };

    $scope.newElem = function (data) {
      if (!data) {
        data = [];
      }
      data.push({});
    };

    $scope.uploadCaptions = function (data) {

      $modal.open({
        templateUrl: 'app/images/modal/images.html', // Url du template HTML
        controller: 'ImagesDialogCtrl',
        size: 'lg',
        scope: $scope,
        resolve: {
          list: function () {
            return data;
          },
          item: function () {
            return {};
          },
          type: function () {
            return 'caption';
          }
        }
      });
    };

    $scope.removeElem = function (item, data, type, $index) {
      if (item._id) {
        $http.delete('/api/' + type + 's/' + item._id).then(function () {
          data.splice($index, 1);
        }, function (err) {
          $log.debug(err);
        });
      } else {
        data.splice($index, 1);
      }
    };

  });
