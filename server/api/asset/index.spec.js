'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var assetCtrlStub = {
  index: 'assetCtrl.index',
  show: 'assetCtrl.show',
  create: 'assetCtrl.create',
  update: 'assetCtrl.update',
  destroy: 'assetCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var assetIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './asset.controller': assetCtrlStub
});

describe('Asset API Router:', function() {

  it('should return an express router instance', function() {
    assetIndex.should.equal(routerStub);
  });

  describe('GET /api/assets', function() {

    it('should route to asset.controller.index', function() {
      routerStub.get
                .withArgs('/', 'assetCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/assets/:id', function() {

    it('should route to asset.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'assetCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/assets', function() {

    it('should route to asset.controller.create', function() {
      routerStub.post
                .withArgs('/', 'assetCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/assets/:id', function() {

    it('should route to asset.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'assetCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/assets/:id', function() {

    it('should route to asset.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'assetCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/assets/:id', function() {

    it('should route to asset.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'assetCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
