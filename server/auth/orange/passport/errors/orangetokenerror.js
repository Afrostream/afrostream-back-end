/**
 * `OrangeTokenError` error.
 *
 * OrangeTokenError represents an error received from a Orange's token
 * endpoint.  Note that these responses don't conform to the OAuth 2.0
 * specification.
 */
function OrangeTokenError (message, type, code, subcode) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'OrangeTokenError';
  this.message = message;
  this.type = type;
  this.code = code;
  this.subcode = subcode;
  this.status = 500;
}

/**
 * Inherit from `Error`.
 */
OrangeTokenError.prototype.__proto__ = Error.prototype;


/**
 * Expose `OrangeTokenError`.
 */
module.exports = OrangeTokenError;
