var bluebird = require('bluebird');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook');

/**
 * - si personne d’a de facebookId , je crée un user from scratch et je lui assigne le bouygueId
 * - si lors du signin je trouve deja queql’un qui a un facebookId je fail
 * - si je suis loggué (_id) et que je veux lier mon compte facebook je trouve deja queql’un qui a un facebookId je fail
 * - sinon je link
 **/
exports.setup = function (User, config) {
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/auth/facebook/callback',
      enableProof: true,
      profileFields: [
        'displayName',
        'emails',
        'name'
      ],
      passReqToCallback: true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function (req, accessToken, refreshToken, profile, done) {
      //req don't have user, so we pass it in query
      var state = new Buffer(req.query.state, 'base64').toString('ascii');
      state = JSON.parse(state);
      var status = state.status;
      var email = profile.emails[0].value;
      var userId = req.user ? req.user._id : state.userId;
      console.log('facebook user', userId);
      bluebird.resolve(req.user)
        .then(function (user) {
          // user exist => continue
          if (user) return user;
          // missing in req.user ? => fetching in DB
          var whereUser = [{'facebook.id': profile.id}];
          if (status !== 'signin') {
            whereUser.push({'email': {$iLike: email}});
          }
          return User.find({
            where: {
              $or: whereUser
            }
          });
        })
        .then(function (user) {
          if (!user && userId) {
            return User.find({
              where: {'_id': userId}
            });
          } else {
            return user;
          }
        })
        .then(function (user) {
          if (user) {
            if (userId && userId != user._id) {
              throw new Error('Your profile is already linked to another user');
            }
            // user exist => update
            user.name = user.name || profile.displayName;
            user.facebook = profile._json;
            return user.save();
          } else {
            if (status === 'signin') {
              throw new Error('No user found, please associate your profile after being connected');
            }

            // new user => create
            return User.create({
              name: profile.displayName,
              email: email,
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
