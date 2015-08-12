'use strict';

describe('Controller: ImagesCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var ImagesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ImagesCtrl = $controller('ImagesCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
