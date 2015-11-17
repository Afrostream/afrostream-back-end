'use strict';

angular.module('afrostreamAdminApp')
  .factory('Post', function ($resource) {
    return $resource('/api/posts/:id/:controller', {
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
