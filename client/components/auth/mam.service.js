'use strict';

angular.module('afrostreamAdminApp')
  .factory('Mam', function ($resource) {
    return $resource('/api/mam/:id/:controller', {
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
