'use strict';

angular.module('afrostreamAdminApp')
  .factory('Season', function ($resource) {
    return $resource('/api/seasons/:id/:controller', {
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
