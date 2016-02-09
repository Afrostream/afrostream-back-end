var Joi = require('joi');

var createBody = Joi.object().keys({
  email: Joi.string().max(255).email().required(),
  password: Joi.string().max(50).min(6).required()
});

module.exports.validateCreateBody = function (req, res, next) {
  Joi.validate(req.body, createBody, { allowUnknown: true }, function (err) {
    if (err) {
      console.error('ERROR: /api/users: ' + String(err));
      return res.status(422).send({error: String(err)});
    }
    next();
  });
};