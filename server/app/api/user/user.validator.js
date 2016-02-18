var Joi = require('joi');

var createBody = Joi.object().keys({
  email: Joi.string().max(255).email().required(),
  password: Joi.string().max(50).min(6).required()
});

var updateBody = Joi.object().keys({
  email: Joi.string().max(255).email(),
  name: Joi.string().max(255),
  first_name: Joi.string().max(255),
  last_name: Joi.string().max(255),
  bouyguesId: Joi.string().max(128)
});

module.exports.validateCreateBody = function (req, res, next) {
  Joi.validate(req.body, createBody, { allowUnknown: true }, function (err) {
    if (err) {
      console.error('ERROR: POST /api/users: ' + String(err));
      return res.status(422).send({error: String(err)});
    }
    next();
  });
};

module.exports.validateUpdateBody = function (req, res, next) {
  Joi.validate(req.body, updateBody, { allowUnknown: true }, function (err) {
    if (err) {
      console.error('ERROR: PUT /api/users/me: ' + String(err));
      return res.status(422).send({error: String(err)});
    }
    next();
  });
};