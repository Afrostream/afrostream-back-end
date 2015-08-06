'use strict';

angular.module('afrostreamAdminApp')
  .factory('Season', function ($resource) {
    return $resource('/api/seasons/:id/:controller', {
        id: '@_id'
      },
      {
        getEpisodes: {
          method: 'GET',
          params: {
            controller: 'episodes'
          }
        },
        addEpisodes: {
          method: 'PUT',
          params: {
            controller: 'episodes'
          }
        },
        get: {
          method: 'GET',
          params: {
            id: '0'
          }
        }
      });
  });
