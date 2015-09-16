'use strict';

var app = require('../../app');
var request = require('supertest');

var newCategory;

describe('Category API:', function () {

  describe('GET /api/categorys', function () {
    var categorys;

    beforeEach(function (done) {
      request(app)
        .get('/api/categorys')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          categorys = res.body;
          done();
        });
    });

    it('should respond with JSON array', function () {
      categorys.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/categorys', function () {
    beforeEach(function (done) {
      request(app)
        .post('/api/categorys')
        .send({
          label: 'New Category',
          slug: 'This is the brand new category!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          newCategory = res.body;
          done();
        });
    });

    it('should respond with the newly created category', function () {
      newCategory.label.should.equal('New Category');
      newCategory.slug.should.equal('This is the brand new category!!!');
    });

  });

  describe('GET /api/categorys/:id', function () {

    describe('without nested objects', function () {
      var category;

      beforeEach(function (done) {
        request(app)
          .get('/api/categorys/' + newCategory._id)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) {
              return done(err);
            }
            category = res.body;
            done();
          });
      });

      afterEach(function () {
        category = {};
      });

      it('should respond with the requested category', function () {
        category.label.should.equal('New Category');
        category.slug.should.equal('This is the brand new category!!!');
      })
    });

    describe('with movies', function () {
      it('should do something', function () {
        return false;
      })
    });
  });

  describe('PUT /api/categorys/:id', function () {
    var updatedCategory

    beforeEach(function (done) {
      request(app)
        .put('/api/categorys/' + newCategory._id)
        .send({
          label: 'Updated Category',
          slug: 'This is the updated category!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          updatedCategory = res.body;
          done();
        });
    });

    afterEach(function () {
      updatedCategory = {};
    });

    it('should respond with the updated category', function () {
      updatedCategory.label.should.equal('Updated Category');
      updatedCategory.slug.should.equal('This is the updated category!!!');
    });

  });

  describe('DELETE /api/categorys/:id', function () {

    it('should respond with 204 on successful removal', function (done) {
      request(app)
        .delete('/api/categorys/' + newCategory._id)
        .expect(204)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when category does not exist', function (done) {
      request(app)
        .delete('/api/categorys/' + newCategory._id)
        .expect(404)
        .end(function (err, res) {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
