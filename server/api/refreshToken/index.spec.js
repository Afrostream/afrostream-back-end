'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var refreshTokenCtrlStub = {
  index: 'refreshTokenCtrl.index',
  show: 'refreshTokenCtrl.show',
  create: 'refreshTokenCtrl.create',
  update: 'refreshTokenCtrl.update',
  destroy: 'refreshTokenCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var refreshTokenIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './refreshToken.controller': refreshTokenCtrlStub
});

describe('RefreshToken API Router:', function() {

  it('should return an express router instance', function() {
    refreshTokenIndex.should.equal(routerStub);
  });

  describe('GET /api/refreshTokens', function() {

    it('should route to refreshToken.controller.index', function() {
      routerStub.get
                .withArgs('/', 'refreshTokenCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/refreshTokens/:id', function() {

    it('should route to refreshToken.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'refreshTokenCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/refreshTokens', function() {

    it('should route to refreshToken.controller.create', function() {
      routerStub.post
                .withArgs('/', 'refreshTokenCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/refreshTokens/:id', function() {

    it('should route to refreshToken.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'refreshTokenCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/refreshTokens/:id', function() {

    it('should route to refreshToken.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'refreshTokenCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/refreshTokens/:id', function() {

    it('should route to refreshToken.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'refreshTokenCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
