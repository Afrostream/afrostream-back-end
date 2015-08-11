'use strict';

describe('Controller: VideosCtrl', function () {

  // load the controller's module
  beforeEach(module('afrostreamAdminApp'));

  var VideosCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    VideosCtrl = $controller('VideosCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
