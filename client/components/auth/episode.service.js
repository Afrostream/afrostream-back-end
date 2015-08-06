'use strict';

angular.module('afrostreamAdminApp')
  .factory('Episode', function ($resource) {
    return $resource('/api/episodes/:id/:controller', {
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
