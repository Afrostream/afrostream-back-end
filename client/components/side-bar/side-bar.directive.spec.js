'use strict';

describe('Directive: sideBar', function () {

  // load the directive's module and view
  beforeEach(module('afrostreamAdminApp'));
  beforeEach(module('components/side-bar/side-bar.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<side-bar></side-bar>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the sideBar directive');
  }));
});