'use strict';

angular.module('afrostreamAdminApp')
  .factory('Widget', function ($resource) {
    return $resource('/api/widgets', {
        id: '@_id'
      },
      {
        get: {
          method: 'GET'
        }
      });
  });
