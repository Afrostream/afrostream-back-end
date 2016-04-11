'use strict';

angular.module('afrostreamAdminApp')
  .controller('ImportCtrl', function ($scope, $http, $modal) {
    $scope.contentList = [];

    $scope.states = [
      'initialized',
      'ready',
      'failed'
    ];

    // FIXME: move to config
    var PFProto = 'http';
    var PFAuthority = 'p-afsmsch-001.afrostream.tv:4000';
    var PFBaseUrl = PFProto + '://' + PFAuthority;

    $scope.setState = function (newState) {
      $scope.state = newState;
      $http({
        url: PFBaseUrl + '/api/contents',
        params: {
          'state': $scope.state,
          'limit': 10
        }
      }).then(function (result) {
        $scope.contentList = result.data;
      })
    };

    $scope.fixme = function () {
      alert('not yet implemented :)');
    };

    // initialisation
    $scope.setState($scope.states[0]);
  });
