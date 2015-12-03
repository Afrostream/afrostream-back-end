'use strict';

angular.module('afrostreamAdminApp')
  .controller('VideosCtrl', function ($scope, $log, $http, $modal, Asset, Caption, Lang, jobs) {

    // bool: activate/desactivate the feature.
    $scope.triggerCaptionPackaging = true;

    if ($scope.triggerCaptionPackaging) {
      /**
       * This code is used to trigger captions packing automatically.
       * Workflow:
       *    on open, we check
       *    after video update, we check
       */
      var fromCaptionToSimplifiedCaption = function (caption) {
        if (!caption) {
          return null;
        }
        return {_id: caption._id, langId: caption.langId, src: caption.src};
      };

      var simplifiedCaptionsEquals = function (c1, c2) {
        return c1._id === c2._id &&
          c1.langId === c2.langId &&
          c1.src === c2.src;
      };

      var simplifiedCaptionsArrayEquals = function (a, b) {
        if (a.length !== b.length) {
          return false;
        }
        for (var i = 0; i < a.length; ++i) {
          if (!simplifiedCaptionsEquals(a[i], b[i])) {
            return false;
          }
        }
        return true;
      };

      var getSimplifiedCaptionsArray = function (item) {
        var captions = (item && item.captions) || [];
        return captions.map(fromCaptionToSimplifiedCaption).filter(function (sc) {
          return sc;
        });
      };

      if ($scope.modalHooks) {
        var onOpenSimplifiedCaptions;
        $scope.$watch('item', function () {
          if (!$scope.item || onOpenSimplifiedCaptions) return;
          onOpenSimplifiedCaptions = getSimplifiedCaptionsArray($scope.item);
        });
        var triggerJobIfModified = function (data) {
          if (!$scope.item) return;
          var simplifiedCaptions = getSimplifiedCaptionsArray($scope.item);
          if (!simplifiedCaptionsArrayEquals(onOpenSimplifiedCaptions, simplifiedCaptions)) {
            jobs.createJobpackCaption(data._id)
          }
        };
        $scope.modalHooks.afterAdd = triggerJobIfModified;
        $scope.modalHooks.afterUpdate = triggerJobIfModified;
      }

      // manual packaging
      $scope.packCaptions = function () {
        jobs.createJobpackCaption($scope.item._id);
      };
    }

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

    $scope.newElemFromMam = function (data) {
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
