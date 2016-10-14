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

  if (json.identity) {
    profile.displayName = json.identity.surname;
    profile.name = {
      familyName: json.identity.name,
      givenName: json.identity.surname
    };
    profile.gender = json.identity.title;
  }


  if (json.adress) {
    profile.address = json.adress
  }

  if (json.phone) {
    profile.phones = json.phone;
  }

  if (json.email) {
    profile.emails = json.email;
  }

  return profile;
};
