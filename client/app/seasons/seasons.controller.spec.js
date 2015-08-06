'use strict';

describe('Controller: SeasonsCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var SeasonsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SeasonsCtrl = $controller('SeasonsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
