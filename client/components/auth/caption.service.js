'use strict';

angular.module('afrostreamAdminApp')
  .factory('Caption', function ($resource) {
    return $resource('/api/captions/:id/:controller', {
        id: '@_id'
      },
      {
        update: {
          method: 'PUT'
        },
        get: {
          method: 'GET',
          params: {
            id: 'me'
          }
        }
      });
  });
