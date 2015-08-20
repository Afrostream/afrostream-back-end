'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var subscriptionCtrlStub = {
  index: 'subscriptionCtrl.index',
  show: 'subscriptionCtrl.show',
  create: 'subscriptionCtrl.create',
  update: 'subscriptionCtrl.update',
  destroy: 'subscriptionCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var subscriptionIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './subscription.controller': subscriptionCtrlStub
});

describe('Subscription API Router:', function() {

  it('should return an express router instance', function() {
    subscriptionIndex.should.equal(routerStub);
  });

  describe('GET /api/subscriptions', function() {

    it('should route to subscription.controller.index', function() {
      routerStub.get
                .withArgs('/', 'subscriptionCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/subscriptions/:id', function() {

    it('should route to subscription.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'subscriptionCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/subscriptions', function() {

    it('should route to subscription.controller.create', function() {
      routerStub.post
                .withArgs('/', 'subscriptionCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/subscriptions/:id', function() {

    it('should route to subscription.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'subscriptionCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/subscriptions/:id', function() {

    it('should route to subscription.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'subscriptionCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/subscriptions/:id', function() {

    it('should route to subscription.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'subscriptionCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
