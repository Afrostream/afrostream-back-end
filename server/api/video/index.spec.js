'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var videoCtrlStub = {
  index: 'videoCtrl.index',
  show: 'videoCtrl.show',
  create: 'videoCtrl.create',
  update: 'videoCtrl.update',
  destroy: 'videoCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var videoIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './video.controller': videoCtrlStub
});

describe('Video API Router:', function() {

  it('should return an express router instance', function() {
    videoIndex.should.equal(routerStub);
  });

  describe('GET /api/videos', function() {

    it('should route to video.controller.index', function() {
      routerStub.get
                .withArgs('/', 'videoCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/videos/:id', function() {

    it('should route to video.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'videoCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/videos', function() {

    it('should route to video.controller.create', function() {
      routerStub.post
                .withArgs('/', 'videoCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/videos/:id', function() {

    it('should route to video.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'videoCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/videos/:id', function() {

    it('should route to video.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'videoCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/videos/:id', function() {

    it('should route to video.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'videoCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
