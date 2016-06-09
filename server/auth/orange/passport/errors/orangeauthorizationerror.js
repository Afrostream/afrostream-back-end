/**
 * `OrangeAuthorizationError` error.
 *
 * OrangeAuthorizationError represents an error in response to an
 * authorization request on Orange.  Note that these responses don't conform
 * to the OAuth 2.0 specification.
 */
function OrangeAuthorizationError (message, code) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'OrangeAuthorizationError';
  this.message = message;
  this.code = code;
  this.status = 500;
}

/**
 * Inherit from `Error`.
 */
OrangeAuthorizationError.prototype.__proto__ = Error.prototype;


/**
 * Expose `OrangeAuthorizationError`.
 */
module.exports = OrangeAuthorizationError;
