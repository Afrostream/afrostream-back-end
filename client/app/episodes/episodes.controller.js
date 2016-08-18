'use strict';

angular.module('afrostreamAdminApp')
  .controller('EpisodesCtrl', function ($scope, Season, Video) {
    $scope.vXstYList = [
      'auto',
      'VF',
      'VO',
      'VF,VO',
      'VOST',
      'VF,VOST',
      'VOSTFR',
      'VF,VOSTFR',
      'VD'
    ];

    $scope.$watch('item.episodeNumber', function() {
      if ($scope.item) {
        $scope.item.sort = $scope.item.episodeNumber;
      }
    }, true);

    $scope.loadSeasons = function (query) {
      var p = Season.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };

    $scope.loadVideo = function (query) {
      var p = Video.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };

    $scope.$watch('item.video', function() {
      if ($scope.item && $scope.item.video && $scope.item.video._id) {
        Video.get({id:$scope.item.video._id}, function (video) {
          var source = ((video && video.sources || []).filter(function (source) {
            return source && source.type === 'application/dash+xml';
          })).pop();
          if (source) {
            $scope.mpd = source.src;
          }
        });
      } else {
        $scope.mpd = null;
      }
    }, true);

    //// COUNTRIES ////
    var updateScopeCountriesProps = function () {
      $scope.countriesProps = {
        countries : $scope.item && $scope.item.countries || [],
        onChange: function (countries) {
          $scope.item.countries = countries;
        }
      };
    }
    updateScopeCountriesProps();
    $scope.$watch('item', updateScopeCountriesProps);

    //// BROADCASTERS ///
    var updateScopeBroadcastersProps = function () {
      $scope.broadcastersProps = {
        broadcasters : $scope.item && $scope.item.broadcasters || [],
        onChange: function (broadcasters) {
          $scope.item.broadcasters = broadcasters;
        }
      };
    }
    updateScopeBroadcastersProps();
    $scope.$watch('item', updateScopeBroadcastersProps);
  });
