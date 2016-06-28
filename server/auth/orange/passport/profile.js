var _ = require('lodash');

/**
 * Parse profile.
 *
 * @param {Object|String} json
 * @return {Object}
 * @api private
 */
exports.parse = function (json) {
  if ('string' == typeof json) {
    json = JSON.parse(json);
  }

  // cleaning json to create user "identity"
  var omitedKeys = _.filter(_.keys(json), function (key) {
    return _.isUndefined(json[key])
  });
  omitedKeys.push('getAssertionXml');
  var identity = _.omit(json, omitedKeys);

  // todo: get expire value from token ted=1468156418
  var expiresIn = 5256000; //2 month
  var regex = /ted=([0-9].*)(\|tcd)/g;
  var match = regex.exec(identity.OrangeAPIToken);
  if (match && match.length) {
    expiresIn = ((match[1] * 1000) - Date.now()) / 1000;
  }

  var profile = {
    provider: 'orange',
    expiresIn: expiresIn,
    identity: identity
  };
  return profile;
};
