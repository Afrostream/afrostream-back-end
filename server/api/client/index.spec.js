'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var clientCtrlStub = {
  index: 'clientCtrl.index',
  show: 'clientCtrl.show',
  create: 'clientCtrl.create',
  update: 'clientCtrl.update',
  destroy: 'clientCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var clientIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './client.controller': clientCtrlStub
});

describe('Client API Router:', function() {

  it('should return an express router instance', function() {
    clientIndex.should.equal(routerStub);
  });

  describe('GET /api/clients', function() {

    it('should route to client.controller.index', function() {
      routerStub.get
                .withArgs('/', 'clientCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/clients/:id', function() {

    it('should route to client.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'clientCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/clients', function() {

    it('should route to client.controller.create', function() {
      routerStub.post
                .withArgs('/', 'clientCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/clients/:id', function() {

    it('should route to client.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'clientCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/clients/:id', function() {

    it('should route to client.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'clientCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/clients/:id', function() {

    it('should route to client.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'clientCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
