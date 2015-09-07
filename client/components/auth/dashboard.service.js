'use strict';

angular.module('afrostreamAdminApp')
  .factory('Dashboard', function ($resource) {
    return $resource('/api/dashboard/:id/:controller', {
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
