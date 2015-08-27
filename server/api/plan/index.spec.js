'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var planCtrlStub = {
  index: 'planCtrl.index',
  show: 'planCtrl.show',
  create: 'planCtrl.create',
  update: 'planCtrl.update',
  destroy: 'planCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var planIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './plan.controller': planCtrlStub
});

describe('Plan API Router:', function() {

  it('should return an express router instance', function() {
    planIndex.should.equal(routerStub);
  });

  describe('GET /api/plans', function() {

    it('should route to plan.controller.index', function() {
      routerStub.get
                .withArgs('/', 'planCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/plans/:id', function() {

    it('should route to plan.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'planCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/plans', function() {

    it('should route to plan.controller.create', function() {
      routerStub.post
                .withArgs('/', 'planCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/plans/:id', function() {

    it('should route to plan.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'planCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/plans/:id', function() {

    it('should route to plan.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'planCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/plans/:id', function() {

    it('should route to plan.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'planCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
