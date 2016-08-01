'use strict';

angular.module('afrostreamAdminApp')
  .controller('MoviesCtrl', function ($scope, $http, Category, Season, Licensor, Video, Actor) {
    var addAutocompleteTitle = function (season) {
      season.autocompleteTitle = 'S'+(season.seasonNumber||'?')+' - '+season.title;
    };

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

    var hydrateActor = function (actor) {
      actor.fullName = actor.firstName + ' ' + actor.lastName;
    };

    if ($scope.modalHooks) {
      $scope.modalHooks.hydrateItem = function (item) {
        if (item.seasons) {
          item.seasons.forEach(function (season) {
            if (season) {
              addAutocompleteTitle(season);
            }
          });
        }
        item.actors.forEach(hydrateActor);
        return item;
      };
    }

    $scope.loadCategorys = function (query) {
      return Category.query({query: query}).$promise;
    };
    $scope.loadSeasons = function (query) {
      return Season.query({query: query}).$promise.then(function (seasons) {
        seasons.forEach(addAutocompleteTitle);
        return seasons;
      })
    };
    $scope.loadLicensors = function (query) {
      return Licensor.query({query: query}).$promise;
    };
    $scope.isSerie = function () {
      if (!$scope.item) return false;
      return $scope.item.type === 'serie';
    };
    $scope.isMovie = function () {
      if (!$scope.item) return false;
      return $scope.item.type === 'movie';
    };
    $scope.loadVideo = function (query) {
      var p = Video.query({query: query}).$promise;
      p.then(function (response) {
        return response;
      });
      return p;
    };
    $scope.loadActors = function (query) {
      return Actor.query({query: query}).$promise.then(function (actors) {
        angular.forEach(actors, hydrateActor);
        return actors;
      });
    };
    $scope.searchFirstVideo = function () {
      $http.get('/api/movies/'+$scope.item._id+'/seasons/first/episodes/first/video')
        .then(function (res) {
          if (res && res.data && res.data._id) {
            $scope.item.video = res.data;
          }
        });
    };

    $scope.$watch('item.video', function() {
      if ($scope.item && $scope.item.video && $scope.item.video._id) {
        console.log($scope.item.video);
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
  })
;
