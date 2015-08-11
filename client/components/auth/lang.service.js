'use strict';

angular.module('afrostreamAdminApp')
  .factory('Lang', function ($resource) {
    return $resource('/api/languages/:id/:controller', {
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
