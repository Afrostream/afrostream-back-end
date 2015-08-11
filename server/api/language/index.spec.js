'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var languageCtrlStub = {
  index: 'languageCtrl.index',
  show: 'languageCtrl.show',
  create: 'languageCtrl.create',
  update: 'languageCtrl.update',
  destroy: 'languageCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var languageIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './language.controller': languageCtrlStub
});

describe('Language API Router:', function() {

  it('should return an express router instance', function() {
    languageIndex.should.equal(routerStub);
  });

  describe('GET /api/languages', function() {

    it('should route to language.controller.index', function() {
      routerStub.get
                .withArgs('/', 'languageCtrl.index')
                .should.have.been.calledOnce;
    });

  });

  describe('GET /api/languages/:id', function() {

    it('should route to language.controller.show', function() {
      routerStub.get
                .withArgs('/:id', 'languageCtrl.show')
                .should.have.been.calledOnce;
    });

  });

  describe('POST /api/languages', function() {

    it('should route to language.controller.create', function() {
      routerStub.post
                .withArgs('/', 'languageCtrl.create')
                .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/languages/:id', function() {

    it('should route to language.controller.update', function() {
      routerStub.put
                .withArgs('/:id', 'languageCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/languages/:id', function() {

    it('should route to language.controller.update', function() {
      routerStub.patch
                .withArgs('/:id', 'languageCtrl.update')
                .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/languages/:id', function() {

    it('should route to language.controller.destroy', function() {
      routerStub.delete
                .withArgs('/:id', 'languageCtrl.destroy')
                .should.have.been.calledOnce;
    });

  });

});
