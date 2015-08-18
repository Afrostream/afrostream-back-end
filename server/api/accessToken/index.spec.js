'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var accessTokenCtrlStub = {
  index: 'accessTokenCtrl.index',
  show: 'accessTokenCtrl.show',
  create: 'accessTokenCtrl.create',
  update: 'accessTokenCtrl.update',
  destroy: 'accessTokenCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var accessTokenIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './accessToken.controller': accessTokenCtrlStub
});

describe('AccessToken API Router:', function() {

  it('should return an express router instance', function() {
    accessTokenIndex.should.equal(routerStub);
  });

  describe('GET /api/accessTokens', function() {

    it('should route to accessToken.controller.index', function() {
      routerStub.get
                .withArgs('/', 'accessTokenCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/accessTokens/:id', function() {

    it('should route to accessToken.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'accessTokenCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/accessTokens', function() {

    it('should route to accessToken.controller.create', function() {
      routerStub.post
                .withArgs('/', 'accessTokenCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/accessTokens/:id', function() {

    it('should route to accessToken.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'accessTokenCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/accessTokens/:id', function() {

    it('should route to accessToken.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'accessTokenCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/accessTokens/:id', function() {

    it('should route to accessToken.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'accessTokenCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
