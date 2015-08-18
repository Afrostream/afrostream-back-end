'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var authCodeCtrlStub = {
  index: 'authCodeCtrl.index',
  show: 'authCodeCtrl.show',
  create: 'authCodeCtrl.create',
  update: 'authCodeCtrl.update',
  destroy: 'authCodeCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var authCodeIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './authCode.controller': authCodeCtrlStub
});

describe('AuthCode API Router:', function() {

  it('should return an express router instance', function() {
    authCodeIndex.should.equal(routerStub);
  });

  describe('GET /api/authCodes', function() {

    it('should route to authCode.controller.index', function() {
      routerStub.get
                .withArgs('/', 'authCodeCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/authCodes/:id', function() {

    it('should route to authCode.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'authCodeCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/authCodes', function() {

    it('should route to authCode.controller.create', function() {
      routerStub.post
                .withArgs('/', 'authCodeCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/authCodes/:id', function() {

    it('should route to authCode.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'authCodeCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/authCodes/:id', function() {

    it('should route to authCode.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'authCodeCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/authCodes/:id', function() {

    it('should route to authCode.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'authCodeCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
