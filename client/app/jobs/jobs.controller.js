'use strict';

angular.module('afrostreamAdminApp')
  .controller('JobsCtrl', function ($scope, $http, $interval, jobs) {
    $scope.ready=false;
    $http.get('/api/configs/client').then(function (result) {
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
        var previousStats = $scope.stats || null;
        jobs.getStats().then(function (stats) {
          $scope.stats = stats;
          var statsState = $scope.stateFilter + 'Count';
          if (previousStats &&
              previousStats[statsState] !== stats[statsState]) {
            refreshList();
          }
        });
      };

      var refreshList = function () {
        jobs.getJobs($scope.stateFilter, '0..50').then(function (jobs) {
          $scope.jobs = jobs.map(function (job) {
            job.created_at = (new Date(parseInt(job.created_at))).toString();
            job.started_at = (new Date(parseInt(job.started_at))).toString();
            return job;
          });
        })
      };

      var refresh = function () {
        refreshButtons();
      };

      $scope.retryJob = function (jobId) { jobs.retry(jobId).then(function () { refreshList(); }); };

      $scope.deleteJob = function (jobId) { jobs.remove(jobId).then(function () { refreshList(); }) };

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
