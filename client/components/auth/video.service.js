'use strict';

angular.module('afrostreamAdminApp')
  .factory('Video', function ($resource) {
    return $resource('/api/videos/:id/:controller', {
        id: '@_id'
      },
      {
        get: {
          method: 'GET',
          params: {
            id: 'me'
          }
        }
      });
  });
