'use strict';

angular.module('afrostreamAdminApp')
  .directive('clients', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/clients/clients.html',
      controller: 'ClientsCtrl'
    };
  });
