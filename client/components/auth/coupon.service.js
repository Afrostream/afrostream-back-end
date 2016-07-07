'use strict';

angular.module('afrostreamAdminApp')
  .factory('Coupon', function ($resource) {
    return $resource('/api/billings/couponscampaigns/', {
        id: '@_id'
      },
      {
        query: {
          method: 'GET',
          params: {
            query: '@query'
          }
        }
      });
  });
