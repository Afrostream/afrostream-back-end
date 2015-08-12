'use strict';

angular.module('afrostreamAdminApp')
  .factory('Image', function ($resource) {
    return $resource('/api/images/:id/:controller', {
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
