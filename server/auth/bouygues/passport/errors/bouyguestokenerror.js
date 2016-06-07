/**
 * `BouyguesTokenError` error.
 *
 * BouyguesTokenError represents an error received from a Bouygues's token
 * endpoint.  Note that these responses don't conform to the OAuth 2.0
 * specification.
 */
function BouyguesTokenError (message, type, code, subcode) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'BouyguesTokenError';
  this.message = message;
  this.type = type;
  this.code = code;
  this.subcode = subcode;
  this.status = 500;
}

/**
 * Inherit from `Error`.
 */
BouyguesTokenError.prototype.__proto__ = Error.prototype;


/**
 * Expose `BouyguesTokenError`.
 */
module.exports = BouyguesTokenError;
