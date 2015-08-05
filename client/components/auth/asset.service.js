'use strict';

angular.module('afrostreamAdminApp')
  .factory('Asset', function ($resource) {
    return $resource('/api/assets/:id/:controller', {
        id: '@_id'
      },
      {
        get: {
          method: 'GET',
          params: {
            id: 'me'
          }
        }
      });
  });
