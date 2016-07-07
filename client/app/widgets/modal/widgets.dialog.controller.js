'use strict';

angular.module('afrostreamAdminApp')
  .controller('WidgetsDialogCtrl', function ($scope, $filter, $sce, $modal, Coupon) {

    var generateTimeout = 0;

    $scope.hasCoupon = function () {
      return $scope.item && $scope.item.data && typeof $scope.item.data.coupon === 'object'
    };

    $scope.loadCoupons = function (query) {
      return Coupon.query({query: query}).$promise;
    };

    $scope.loadCoupons({
      billingProviderName: 'afr',
      couponCampaignType: 'standard'
    }).then(function (response) {
      $scope.coupons = response.couponsCampaigns;
    })

    $scope.uploadWidget = function () {
      var m = $modal.open({
        templateUrl: 'app/images/modal/upload.html',
        controller: 'ImagesUploadDialogCtrl',
        size: 'lg',
        scope: $scope,
        resolve: {
          type: function () {
            return 'widget';
          }
        }
      });
      m.onClose = function (image) {
        if (image) {
          $scope.item.image = image;
        }
      };
    };

    $scope.$watch('item', function (item) {
      clearTimeout(generateTimeout)
      generateTimeout = setTimeout(function () {
        var data = item && item.data || {};
        data.class = data.class || 'afrostream-button';
        data.width = data.width || 300;
        data.height = data.height || 250;
        $scope.code = '<script class="' + data.class + '" src="https://widget.afrostream.tv/dist/checkout.js"';
        if (item && item.image && typeof item.image === 'object') {
          $scope.code += 'data-src="' + item.image.imgix + '" data-width="' + data.width + '" data-height="' + data.height + '" ';
        }
        if (data.label) {
          $scope.code += 'data-label="' + data.label + '" ';
        }
        if (data.coupon && typeof data.coupon === 'object') {
          $scope.code += 'data-coupon="' + data.coupon.couponsCampaignBillingUuid + '" ';
        }
        $scope.code += '></script>'
        $scope.jsonString = $sce.trustAsHtml($scope.code);
      }, 1000)
    }, true);

    $scope.deliberatelyTrustDangerousSnippet = function () {
      return $sce.trustAsHtml($scope.code);
    };

  })
;
