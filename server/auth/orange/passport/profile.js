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

  var profile = {};

  profile.id = json.nameID;
  profile.orangeAPIToken = json.OrangeAPIToken;
  //todo get expire value from token ted=1468156418
  var expiresIn = 87600; //2 month
  var regex = /ted=([0-9].*)(\|tcd)/g;
  var match = regex.exec(profile.orangeAPIToken);
  var now = new Date().getTime();

  if (match && match.length) {
    var timestamp = match[1];
    expiresIn = ((timestamp * 1000) - Date.now()) / 1000;
  }
  profile.expiresIn = new Date(now + (expiresIn * 1000));
  profile.collectiveidentifier = json.collectiveidentifier;

  if (json.getAssertionXml) {
    delete json.getAssertionXml;
  }

  profile.provider = 'orange';
  profile._json = json;

  return profile;
};
