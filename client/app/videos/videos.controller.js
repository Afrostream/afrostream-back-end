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

    $scope.removeElem = function (data, $index) {
      data.splice($index, 1);
    };

  });
