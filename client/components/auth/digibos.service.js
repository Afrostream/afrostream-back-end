'use strict';

angular.module('afrostreamAdminApp')
  .factory('Digibos', function ($resource) {
    return $resource('/api/digibos/:id/:controller', {
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
