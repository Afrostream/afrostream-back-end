/**
 * `BouyguesAuthorizationError` error.
 *
 * BouyguesAuthorizationError represents an error in response to an
 * authorization request on Bouygues.  Note that these responses don't conform
 * to the OAuth 2.0 specification.
 */
function BouyguesAuthorizationError (message, code) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'BouyguesAuthorizationError';
  this.message = message;
  this.code = code;
  this.status = 500;
}

/**
 * Inherit from `Error`.
 */
BouyguesAuthorizationError.prototype.__proto__ = Error.prototype;


/**
 * Expose `BouyguesAuthorizationError`.
 */
module.exports = BouyguesAuthorizationError;
