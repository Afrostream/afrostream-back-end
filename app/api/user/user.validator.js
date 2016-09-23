var Joi = require('joi');

var assert = require('better-assert');

var createBody = Joi.object().keys({
  email: Joi.string().max(255).email().required(),
  password: Joi.string().max(50).min(6).required()
});

var createBodyBouygues = Joi.object().keys({
  email: Joi.string().max(255).email(),
  bouyguesId: Joi.string().required()
});

var createBodyOrange = Joi.object().keys({
  ise2: Joi.string().required()
});

var updateBody = Joi.object().keys({
  email: Joi.string().max(255).email(),
  name: Joi.string().max(255),
  first_name: Joi.string().max(255),
  last_name: Joi.string().max(255),
  bouyguesId: Joi.string().max(128),
  ise2: Joi.string().max(128),
  splashList: Joi.array().items(Joi.object(
    {
      _id: Joi.string().required()
    }
  )),
  splashList: Joi.array().items(Joi.object(
    {
      _id: Joi.string().required()
    }
  ))
});

module.exports.validateCreateBody = function (req, res, next) {
  assert(req.passport);

  var schema;
  if (req.passport.client && req.passport.client.isBouyguesMiami()) {
    schema = createBodyBouygues;
  } else if (req.passport.client && (req.passport.client.isOrange() || req.passport.client.isOrangeNewbox())) {
    schema = createBodyOrange;
  } else {
    schema = createBody;
  }
  Joi.validate(req.body, schema, {allowUnknown: true}, function (err) {
    if (err) {
      console.error('ERROR: POST /api/users: ' + String(err));
      return res.status(422).send({error: String(err)});
    }
    next();
  });
};

module.exports.validateUpdateBody = function (req, res, next) {
  Joi.validate(req.body, updateBody, {allowUnknown: true}, function (err) {
    if (err) {
      console.error('ERROR: PUT /api/users/me: ' + String(err));
      return res.status(422).send({error: String(err)});
    }
    next();
  });
};
