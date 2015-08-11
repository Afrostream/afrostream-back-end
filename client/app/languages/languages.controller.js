'use strict';

angular.module('afrostreamAdminApp')
  .controller('LanguagesCtrl', function ($scope, Lang) {
    $scope.languages = Lang.query();
  });
