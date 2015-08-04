'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var episodeCtrlStub = {
  index: 'episodeCtrl.index',
  show: 'episodeCtrl.show',
  create: 'episodeCtrl.create',
  update: 'episodeCtrl.update',
  destroy: 'episodeCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var episodeIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './episode.controller': episodeCtrlStub
});

describe('Episode API Router:', function() {

  it('should return an express router instance', function() {
    episodeIndex.should.equal(routerStub);
  });

  describe('GET /api/episodes', function() {

    it('should route to episode.controller.index', function() {
      routerStub.get
                .withArgs('/', 'episodeCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/episodes/:id', function() {

    it('should route to episode.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'episodeCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/episodes', function() {

    it('should route to episode.controller.create', function() {
      routerStub.post
                .withArgs('/', 'episodeCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/episodes/:id', function() {

    it('should route to episode.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'episodeCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/episodes/:id', function() {

    it('should route to episode.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'episodeCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/episodes/:id', function() {

    it('should route to episode.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'episodeCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
