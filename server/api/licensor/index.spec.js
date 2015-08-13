'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var licensorCtrlStub = {
  index: 'licensorCtrl.index',
  show: 'licensorCtrl.show',
  create: 'licensorCtrl.create',
  update: 'licensorCtrl.update',
  destroy: 'licensorCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var licensorIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './licensor.controller': licensorCtrlStub
});

describe('Licensor API Router:', function() {

  it('should return an express router instance', function() {
    licensorIndex.should.equal(routerStub);
  });

  describe('GET /api/licensors', function() {

    it('should route to licensor.controller.index', function() {
      routerStub.get
                .withArgs('/', 'licensorCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/licensors/:id', function() {

    it('should route to licensor.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'licensorCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/licensors', function() {

    it('should route to licensor.controller.create', function() {
      routerStub.post
                .withArgs('/', 'licensorCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/licensors/:id', function() {

    it('should route to licensor.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'licensorCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/licensors/:id', function() {

    it('should route to licensor.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'licensorCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/licensors/:id', function() {

    it('should route to licensor.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'licensorCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
