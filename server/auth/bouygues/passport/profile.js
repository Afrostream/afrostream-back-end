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

  profile.id = json.cpeid;
  profile.displayName = json.name + ' ' + json.surname;

  profile.name = {
    familyName: json.name,
    middleName: json.surname
  };

  profile.gender = json.title;

  if (json.phone) {
    profile.phones = profile.phone;
  }

  if (json.email) {
    profile.emails = json.email;
  }

  return profile;
};
