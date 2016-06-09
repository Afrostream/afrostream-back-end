/**
 * `OrangeGraphAPIError` error.
 */
function OrangeGraphAPIError (message, type, code, subcode) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'OrangeGraphAPIError';
  this.message = message;
  this.type = type;
  this.code = code;
  this.subcode = subcode;
  this.status = 500;
}

/**
 * Inherit from `Error`.
 */
OrangeGraphAPIError.prototype.__proto__ = Error.prototype;


/**
 * Expose `OrangeGraphAPIError`.
 */
module.exports = OrangeGraphAPIError;
