'use strict';

angular.module('afrostreamAdminApp')
  .directive('subscriptions', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/subscriptions/subscriptions.html',
      controller: 'SubscriptionsCtrl'
    };
  });
