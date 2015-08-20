'use strict';

describe('Controller: SubscriptionsCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var SubscriptionsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SubscriptionsCtrl = $controller('SubscriptionsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
