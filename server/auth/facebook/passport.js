var bluebird = require('bluebird');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook');

exports.setup = function (User, config) {
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      enableProof: true,
      profileFields: [
        'displayName',
        'emails',
        'name'
      ],
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, accessToken, refreshToken, profile, done) {
      var userId = req.query.id;
      var status = req.query.status;
      bluebird.resolve(req.user)
        .then(function (user) {
          // user exist => continue
          if (user) return user;
          // missing in req.user ? => fetching in DB
          var whereUser = [{'facebook.id': profile.id}, {'_id': userId}];
          if (status !== 'signin') {
            whereUser.push({'email': {$iLike: profile.emails[0].value}});
          }
          return User.find({
            where: {
              $or: whereUser
            }
          });
        })
        .then(function (user) {
          if (user) {
            if (userId && userId != user._id) {
              throw new Error('Your profile is already linked to another user');
            }
            // user exist => update
            user.facebook = profile._json;
            return user.save();
          } else {
            if (status === 'signin') {
              throw new Error('No user found, please associate your profile with facebook after being connected');
            }

            // new user => create
            return User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              first_name: profile.name.givenName,
              last_name: profile.name.familyName,
              role: 'user',
              provider: 'facebook',
              facebook: profile._json
            });
          }
        }).nodeify(done);
    }));
};
