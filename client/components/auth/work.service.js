'use strict';

angular.module('afrostreamAdminApp')
  .factory('Work', function ($resource) {
    return $resource('/api/works/:id/:controller', {
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
