'use strict';

angular.module('afrostreamAdminApp')
  .factory('Movie', function ($resource) {
    return $resource('/api/movies/:id/:controller', {
        id: '@_id'
      },
      {
        add: {
          method: 'PUT',
          params: {}
        },
        getInfo: {
          method: 'GET',
          params: {
            id: '0'
          }
        }
      });
  });
