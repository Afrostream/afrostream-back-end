'use strict';

angular.module('afrostreamAdminApp')
  .controller('UsersCtrl', function ($scope, $http) {
    $scope.passwordEditionMode = true;
    $scope.accessTokens = [];
    $scope.modalHooks.onItemLoaded = function () {
      $http({method:'GET', url: '/api/logs/', params: { userId: $scope.item._id,  type: 'access_token' } }).then(function (result) {
        $scope.accessTokens = result.data;
      });

      // load the subscriptions of selected user, to display on the page
      $scope.loadSubscriptions();
    };
    /**
     * Return a brand new randomly generated password
     * @returns {Promise}
     */
    $scope.generateRandomPassword = function() {
      var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
      for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
      }
      return retVal;
    };

    /**
     * check if password is here and push it to the server to store it
     * @returns {Promise}
     */
    $scope.saveNewPassword = function() {
      if ($scope.item.newPassword) {
        return $http({
          method: 'PUT',
          url: '/api/users/password',
          params: {email: $scope.item.email, password: $scope.item.newPassword}
        })
          .then(function (result) {
            if (result.status != 200) {
              $scope.item.newPassword = "";
            }
          });
      } else {
        // do nothing
      }
    };

    $scope.getNewPassword = function() {
      $scope.item.newPassword = $scope.generateRandomPassword();
    };

    /**
     * This method will create and push a new password automatically
     */
    $scope.autoResetPwd = function() {

      $scope.generateRandomPassword()
        .then(function(pwd) {
          $scope.item.newPassword = pwd;
          $scope.saveNewPassword();
        });
    };

    $scope.togglePasswordEdition = function() {
      if ($scope.passwordEditionMode) {
        $scope.passwordEditionMode = false;
      } else {
        $scope.passwordEditionMode = true;
      }
    };

    /**
     * Find the subscriptions for selected user
     * @returns {*}
     */
    $scope.loadSubscriptions = function() {
      return $http({
        method: 'GET',
        url: '/api/subscriptions/status',
        params: {
          userId: $scope.item._id
        }
      })
        .then(function(result) {
          $scope.subscriptions = result.data.subscriptions;
        });
    };



  });
