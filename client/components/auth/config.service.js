'use strict';

angular.module('afrostreamAdminApp')
  .factory('Config', function ($resource) {
    return $resource('/api/configs', {
        id: '@_id'
      },
      {
        get: {
          method: 'GET'
        }
      });
  });
