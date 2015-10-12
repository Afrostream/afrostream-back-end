'use strict';

angular.module('afrostreamAdminApp')
  .factory('Actor', function ($resource) {
    return $resource('/api/actors/:id/:controller', {
        id: '@_id'
      },
      {
        add: {
          method: 'PUT',
          params: {}
        },
        get: {
          method: 'GET',
          params: {
            id: '0'
          }
        }
      });
  });
