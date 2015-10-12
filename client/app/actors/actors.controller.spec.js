'use strict';

describe('Controller: ActorsCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var ActorsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ActorsCtrl = $controller('ActorsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
