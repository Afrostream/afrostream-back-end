/**
 * `BouyguesGraphAPIError` error.
 */
function BouyguesGraphAPIError (message, type, code, subcode) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'BouyguesGraphAPIError';
  this.message = message;
  this.type = type;
  this.code = code;
  this.subcode = subcode;
  this.status = 500;
}

/**
 * Inherit from `Error`.
 */
BouyguesGraphAPIError.prototype.__proto__ = Error.prototype;


/**
 * Expose `BouyguesGraphAPIError`.
 */
module.exports = BouyguesGraphAPIError;
