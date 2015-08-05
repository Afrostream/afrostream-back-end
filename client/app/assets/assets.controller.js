'use strict';

angular.module('afrostreamAdminApp')
  .controller('AssetsCtrl', function ($scope, Asset) {
    // Use the User $resource to fetch all users
    $scope.assets = Asset.query();

    $scope.delete = function (asset) {
      Asset.remove({id: asset._id});
      $scope.assets.splice(this.$index, 1);
    };
  });
