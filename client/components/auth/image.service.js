'use strict';

angular.module('afrostreamAdminApp')
  .factory('Image', function ($resource) {
    return $resource('/api/images/:id/:controller', {
        id: '@_id'
      },
      {
        query: {
          isArray: true,
          method: 'GET',
          params: {
            query: '@query'
          }
        }
      });
  });
