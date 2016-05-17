'use strict';

angular.module('afrostreamAdminApp')
  .controller('SeasonsCtrl', function ($scope, $http, Movie, Episode) {
    var addAutocompleteTitle = function (episode) {
      episode.autocompleteTitle = 'E'+(episode.episodeNumber||'?')+' - '+episode.title;
    };

    $scope.$watch('item.seasonNumber', function() {
      if ($scope.item) {
        $scope.item.sort = $scope.item.seasonNumber;
      }
    }, true);

    if ($scope.modalHooks) {
      $scope.modalHooks.hydrateItem = function (item) {
        if (item.episodes) {
          item.episodes.forEach(function (episode) {
            if (episode) {
              addAutocompleteTitle(episode);
            }
          });
        }
        return item;
      }
    }

    $scope.autoEpisodes = false;
    $scope.loadEpisodes = function (query) {
      return Episode.query({query: query}).$promise.then(function (episodes) {
        episodes.forEach(addAutocompleteTitle);
        return episodes;
      })
    };
    $scope.loadMovies = function (query) {
      return Movie.query({query: query}).$promise;
    };
  });
