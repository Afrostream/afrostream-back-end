'use strict';

describe('Controller: LicensorsCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var LicensorsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LicensorsCtrl = $controller('LicensorsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
