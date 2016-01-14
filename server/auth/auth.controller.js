'use strict';

var Q = require('q');

var URLSafeBase64 = require('urlsafe-base64');

var mailer = rootRequire('/server/components/mailer');

var sqldb = rootRequire('/server/sqldb');
var User = sqldb.User;

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
    var decipher = crypto.createDecipher(cryptoAlgorithm, cryptoPassword)
    var dec = decipher.update(inflated, 'hex', 'utf8')
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
    }
  } catch (e) {
    console.log('error : ' + e);
    return null;
  }
};

var loadUserOrFail = function (email) {
  return User.find({ where: { email: email } })
    .then(function (user) {
      if (!user) {
        return
        throw new Error("cannot find user attached to this email")
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
        if (infos.createdAt < Date.now() - 3600 * 1000) {
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
      function error(err) {
        // error :( log & send the error message
        console.error('/auth/reset: error: ' + err);
        res.status(500).json({ error: String(err) });
      });
};

module.exports.reset = reset;
