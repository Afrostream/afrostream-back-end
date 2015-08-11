'use strict';

describe('Controller: LanguagesCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var LanguagesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LanguagesCtrl = $controller('LanguagesCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
