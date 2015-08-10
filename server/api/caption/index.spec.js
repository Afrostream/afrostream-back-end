'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var captionCtrlStub = {
  index: 'captionCtrl.index',
  show: 'captionCtrl.show',
  create: 'captionCtrl.create',
  update: 'captionCtrl.update',
  destroy: 'captionCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var captionIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './caption.controller': captionCtrlStub
});

describe('Caption API Router:', function() {

  it('should return an express router instance', function() {
    captionIndex.should.equal(routerStub);
  });

  describe('GET /api/captions', function() {

    it('should route to caption.controller.index', function() {
      routerStub.get
                .withArgs('/', 'captionCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/captions/:id', function() {

    it('should route to caption.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'captionCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/captions', function() {

    it('should route to caption.controller.create', function() {
      routerStub.post
                .withArgs('/', 'captionCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/captions/:id', function() {

    it('should route to caption.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'captionCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/captions/:id', function() {

    it('should route to caption.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'captionCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/captions/:id', function() {

    it('should route to caption.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'captionCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
