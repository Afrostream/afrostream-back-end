'use strict';

angular.module('afrostreamAdminApp')
  .controller('JobsCtrl', function ($scope, $http, $interval) {
    $scope.ready=false;
    $http.get('/api/config/client').then(function (result) {
      $scope.ready=true;

      var user = result.data.jobs.basicAuth.user;
      var password = result.data.jobs.basicAuth.password;

      $scope.stateFilter = 'active';
      $scope.jobs = [];
      $scope.updatestateFilter = function (status) {
        $scope.stateFilter = status;
        //
        refreshList();
      };

      var refreshButtons = function () {
        $http.get(result.data.jobs.api + '/stats', {
          headers: { Authorization: 'Basic ' + btoa(user + ':' + password) }
        }).then(function (result) {
          $scope.stats = result.data;
        });
      };

      var refreshList = function () {
        $http.get(result.data.jobs.api + '/jobs/'+$scope.stateFilter+'/0..10/asc', {
          headers: { Authorization: 'Basic ' + btoa(user + ':' + password) }
        }).then(function (result) {
          $scope.jobs = result.data;
        });
      };

      var refresh = function () {
        refreshButtons();
      };

      $scope.stats = {
        inactiveCount: '',
        activeCount: '',
        failedCount: '',
        completeCount: '',
        delayedCount: ''
      };

      var refreshLoop = $interval(refresh, 1000);

      $scope.$on('$destroy',function (){
        if(refreshLoop)
          $interval.cancel(refreshLoop);
      });
    });
  });
