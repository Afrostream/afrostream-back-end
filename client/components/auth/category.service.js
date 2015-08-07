'use strict';

angular.module('afrostreamAdminApp')
  .factory('Category', function ($resource) {
    return $resource('/api/categorys/:id/:controller', {
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
