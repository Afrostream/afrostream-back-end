'use strict';

var Q = require('q');

var URLSafeBase64 = require('urlsafe-base64');

var mailer = rootRequire('components/mailer');

var sqldb = rootRequire('sqldb');
var User = sqldb.User;

var logger = rootRequire('logger').prefix('AUTH');

var validateResetBody = function (body) {
  return function () {
    if (body &&
        typeof body.email === 'string' &&
        typeof body.password === 'string' &&
        body.email && body.password) {
      return;
    }
    if (body &&
        typeof body.k === 'string' && body.k) {
      return;
    }
    throw new Error("malformed input " + JSON.stringify(body));
  };
};

var crypto = require('crypto')
  , cryptoAlgorithm = 'aes-256-ctr'
  , cryptoPassword = 'ri3e|MIzozuzf,("b00zrigc'
  , hashAlgorithm = 'sha256'
  , hashSecret = 'HEP64fa(;:mty;';

var getHash = function (email, password) {
  return crypto.createHmac(hashAlgorithm, hashSecret).update(JSON.stringify([ email, password ])).digest('hex');
};

var encrypt = function (email, password) {
  var hash = getHash(email, password);
  var payload = {
    e: email,
    p: password,
    t: new Date().getTime(), // createdAt (creation date)
    h: hash,                 // hash      (checksum ensuring that it's OUR token)
    v: 1                     // version   (token version number)
  };
  var inflated = JSON.stringify(payload);
  var cipher = crypto.createCipher(cryptoAlgorithm, cryptoPassword);
  // FIXME: optimisation: we might add some gzip here
  var encrypted = Buffer.concat([cipher.update(inflated), cipher.final()]);
  return URLSafeBase64.encode(encrypted);
};

var decrypt = function (k) {
  try {
    if (!URLSafeBase64.validate(k)) {
      throw new Error("base64 decode error");
    }
    var inflated = URLSafeBase64.decode(k);
    var decipher = crypto.createDecipher(cryptoAlgorithm, cryptoPassword);
    var dec = decipher.update(inflated, 'hex', 'utf8');
    dec += decipher.final('utf8');
    var data = JSON.parse(dec);
    var hash = getHash(data.e, data.p);
    if (hash !== data.h) {
      throw new Error("hash mismatch");
    }
    return {
      email: data.e,
      password: data.p,
      createdAt: data.t,
      version: data.v
    };
  } catch (e) {
    logger.error(e.message);
    return null;
  }
};

var loadUserOrFail = function (email) {
  return User.findOne({ where: sqldb.sequelize.where(sqldb.sequelize.fn('lower', sqldb.sequelize.col('email')), email) })
    .then(function (user) {
      if (!user) {
        throw new Error("unknown email " + email);
      }
      return user;
    });
};

/**
 * input body can be :
 *   { k: 'token' }
 * or
 *   { email: 'foo@bar.com', password: 'blabla' }
 */
var reset = function (req, res) {
  Q()
    .then(validateResetBody(req.body))
    .then(function () {
      if (req.body.k) {
        /*
         input body is
           { k: ... }
         => updating password.
        */
        var infos = decrypt(req.body.k);
        if (typeof infos.email !== "string" ||
            typeof infos.password !== "string") {
          throw new Error("malformed token");
        }
        if (infos.createdAt < Date.now() - 2 * 3600 * 1000) { // 2h to reset email
          throw new Error("token expired");
        }
        return loadUserOrFail(infos.email)
          .then(function updateUserPassword(user) {
            user.password = infos.password;
            return user.save();
          });
      } else {
        /*
         input body is
           { email: ..., password: ... }
         => sending an email
        */
        // first, we check if a user attached with this email exist.
        return loadUserOrFail(req.body.email)
          .then(function sendEmail() {
            var token = encrypt(req.body.email, req.body.password);
            return mailer.sendResetPasswordEmail(req.body.email, token);
          });
      }
    })
    .then(
      function success() {
        // everything was ok, sending empty json object.
        res.status(200).json({});
      },
      res.handleError()
    );
};

module.exports.reset = reset;
