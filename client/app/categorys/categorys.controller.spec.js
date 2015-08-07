'use strict';

describe('Controller: CategorysCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var CategorysCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CategorysCtrl = $controller('CategorysCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
