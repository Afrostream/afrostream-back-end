/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/images              ->  index
 * POST    /api/images              ->  create
 * GET     /api/images/:id          ->  show
 * PUT     /api/images/:id          ->  update
 * DELETE  /api/images/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var sqldb = require('../../sqldb');
var Image = sqldb.Image;
var moment = require('moment');
var crypto = require('crypto');
var config = require('../../config/environment');
var Knox = require('knox');

// Create the knox client with your aws settings
Knox.aws = Knox.createClient({
  key: config.amazon.key,
  secret: config.amazon.secret,
  bucket: config.amazon.s3Bucket,
  region: config.amazon.region
});

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function saveUpdates(updates) {
  return function (entity) {
    return entity.updateAttributes(updates)
      .then(function (updated) {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      var filesName = [entity.path];
      Knox.aws.deleteMultiple(filesName, {}, function (err, response) {
        if (err) {
          return handleError(res);
        }
        if (response.statusCode !== 200) {
          return handleError(res, response.statusCode);
        }
        return entity.destroy()
          .then(function () {
            res.status(204).end();
          });
      });
    }
  };
}

// Gets a list of images
exports.index = function (req, res) {
  Image.findAll()
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Gets a single image from the DB
exports.show = function (req, res) {
  Image.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Creates a new image in the DB
exports.create = function (req, res) {
  req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    if (!filename) {
      // If filename is not truthy it means there's no file
      return handleError(res);
    }
    // Create the initial array containing the stream's chunks
    file.fileRead = [];

    file.on('data', function (chunk) {
      // Push chunks into the fileRead array
      this.fileRead.push(chunk);
    });

    file.on('error', function (err) {
      console.log('Error while buffering the stream: ', err);
      return handleError(res);
    });

    file.on('end', function () {
      // Concat the chunks into a Buffer
      var finalBuffer = Buffer.concat(this.fileRead);

      // Generate date based folder prefix
      var datePrefix = moment().format('YYYY[/]MM');
      var key = crypto.randomBytes(10).toString('hex');
      var hashFilename = key + '-' + filename;

      var pathFile = '/poster/' + datePrefix + '/' + hashFilename;

      var headers = {
        'Content-Length': finalBuffer.length,
        'Content-Type': mimetype,
        'x-amz-acl': 'public-read'
      };

      Knox.aws.putBuffer(finalBuffer, pathFile, headers, function (err, response) {
        if (err) {
          console.error('error streaming image: ', new Date(), err);
          return handleError(res);
        }
        if (response.statusCode !== 200) {
          console.error('error streaming image: ', new Date(), err);
          return handleError(res);
        }
        Image.create({
          type: 'poster',
          path: response.req.path,
          url: response.req.url,
          mimetype: mimetype,
          imgix: config.imgix.domain + response.req.path,
          active: true,
          name: filename
        })
          .then(responseWithResult(res, 201))
          .catch(handleError(res));
      });

    });
  });

  req.busboy.on('error', function (err) {
    handleError(err)
  });

  // Start the parsing
  req.pipe(req.busboy);
};

// Updates an existing image in the DB
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Image.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a image from the DB
exports.destroy = function (req, res) {

  Image.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};
