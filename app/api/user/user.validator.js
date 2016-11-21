const Joi = require('joi');

const assert = require('better-assert');

const createBody = Joi.object().keys({
  email: Joi.string().max(255).email().required(),
  password: Joi.string().max(50).min(6).required()
});

const createBodyBouygues = Joi.object().keys({
  email: Joi.string().max(255).email(),
  bouyguesId: Joi.string().required()
});

const createBodyOrange = Joi.object().keys({
  ise2: Joi.string().required()
});

const updateBody = Joi.object().keys({
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
  ))
});

module.exports.validateCreateBody = (req, res, next) => {
  assert(req.passport);

  let schema;
  if (req.passport.client && req.passport.client.isBouyguesMiami()) {
    schema = createBodyBouygues;
  } else if (req.passport.client && (req.passport.client.isOrange() || req.passport.client.isOrangeNewbox())) {
    schema = createBodyOrange;
  } else {
    schema = createBody;
  }
  Joi.validate(req.body, schema, {allowUnknown: true}, err => {
    if (err) {
      return res.handleError(422)(err);
    }
    next();
  });
};

module.exports.validateUpdateBody = (req, res, next) => {
  Joi.validate(req.body, updateBody, {allowUnknown: true}, err => {
    if (err) {
      return res.handleError(422)(err);
    }
    next();
  });
};
