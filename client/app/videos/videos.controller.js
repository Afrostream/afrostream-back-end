'use strict';

angular.module('afrostreamAdminApp')
  .controller('VideosCtrl', function ($scope, $log, $http, Asset, Caption, Lang) {

    $scope.languages = Lang.query();

    $scope.formats = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'application/dash+xml'
    ];

    $scope.$watch('item', function () {
      if (!$scope.item) return;
      $scope.item.sources = $scope.item.sources || [];
      $scope.item.captions = $scope.item.captions || [];
    });

    $scope.newElem = function (data) {
      if (!data) {
        data = [];
      }
      data.push({});
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
