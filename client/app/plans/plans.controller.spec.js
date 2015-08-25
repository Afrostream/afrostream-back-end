'use strict';

describe('Controller: PlansCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var PlansCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PlansCtrl = $controller('PlansCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
