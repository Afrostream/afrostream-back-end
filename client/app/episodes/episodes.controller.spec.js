'use strict';

describe('Controller: EpisodesCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var EpisodesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EpisodesCtrl = $controller('EpisodesCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
