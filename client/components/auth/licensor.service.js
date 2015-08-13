'use strict';

angular.module('afrostreamAdminApp')
  .factory('Licensor', function ($resource) {
    return $resource('/api/licensors/:id/:controller', {
        id: '@_id'
      },
      {
        get: {
          method: 'GET',
          params: {
            id: '0'
          }
        }
      });
  });
