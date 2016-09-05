'use strict';

var _ = require('lodash');

var crypto = require('crypto');
var authTypes = ['github', 'twitter', 'facebook', 'google', 'bouygues', 'orange'];

var validatePresenceOf = function (value) {
  return value && value.length;
};

module.exports = function (sequelize, DataTypes) {
  var User = sequelize.define('User', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: {
        msg: 'The specified email address is already in use.'
      },
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true
      }
    },
    account_code: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    nickname: DataTypes.STRING(32),
    provider: DataTypes.STRING,
    billing_provider: DataTypes.STRING,
    salt: DataTypes.STRING,
    google: DataTypes.JSON,
    github: DataTypes.JSON,
    facebook: DataTypes.JSON,
    orange: DataTypes.JSON,
    bouygues: DataTypes.JSON,
    bouyguesId: DataTypes.STRING(128), // bouygues ise2 id.
    ise2: DataTypes.STRING(128), // orange ise2 id.
    splashList: DataTypes.JSON,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {

    /**
     * Virtual Getters
     */
    getterMethods: {
      // profile information
      profile: function () {
        return {
          'name': this.name,
          'nickname': this.nickname,
          'role': this.role,
          '_id': this._id,
          'email': this.email,
          'provider': this.provider,
          'facebook': this.facebook,
          'orange': this.orange,
          'ise2': this.ise2 || this.orange && this.orange.identify && this.orange.identify.collectiveidentifier || null,  // fixme: security: should this id be exported ?
          'bouygues': this.bouygues,
          'bouyguesId': this.bouyguesId || this.bouygues && this.bouygues.id || null, // fixme: security: should this id be exported ?
          'splashList': this.splashList
        };
      },

      // Non-sensitive info we'll be putting in the token
      token: function () {
        return {
          '_id': this._id,
          'role': this.role
        };
      }
    },

    /**
     * Pre-save hooks
     */
    hooks: {
      beforeBulkCreate: function (users, fields, fn) {
        var totalUpdated = 0;
        users.forEach(function (user) {
          user.updatePassword(function (err) {
            if (err) {
              return fn(err);
            }
            totalUpdated += 1;
            if (totalUpdated === users.length) {
              return fn();
            }
          });
        });
      },
      beforeCreate: function (user, fields, fn) {
        user.updatePassword(fn);
      },
      beforeUpdate: function (user, fields, fn) {
        if (user.changed('password')) {
          return user.updatePassword(fn);
        }
        // ensure bouyguesId & user.bouygues.id are synced
        if (user.changed('bouyguesId')) {
          user.bouygues = _.merge(user.bouygues, {id: user.bouyguesId});
          return fn();
        }
        // ensure orangeId & user.orange.identity.collectiveidentifier are synced
        if (user.changed('ise2')) {
          user.orange = _.merge(user.orange, {identity: {collectiveidentifier: user.ise2}});
          return fn();
        }
        fn();
      }
    },

    /**
     * Instance Methods
     */
    instanceMethods: {
      /**
       * Authenticate - check if the passwords are the same
       *
       * @param {String} password
       * @param {Function} callback
       * @return {Boolean}
       */
      authenticate: function (password, callback) {
        if (!callback) {
          return this.password === this.encryptPassword(password);
        }

        var _this = this;
        this.encryptPassword(password, function (err, pwdGen) {
          if (err) {
            callback(err);
          }

          if (_this.password === pwdGen) {
            callback(null, true);
          }
          else {
            callback(null, false);
          }
        });
      },

      /**
       * Make salt
       *
       * @param {Number} byteSize Optional salt byte size, default to 16
       * @param {Function} callback
       * @return {String}
       */
      makeSalt: function (byteSize, callback) {
        var defaultByteSize = 16;

        if (typeof arguments[0] === 'function') {
          callback = arguments[0];
          byteSize = defaultByteSize;
        }
        else if (typeof arguments[1] === 'function') {
          callback = arguments[1];
        }

        if (!byteSize) {
          byteSize = defaultByteSize;
        }

        if (!callback) {
          return crypto.randomBytes(byteSize).toString('base64');
        }

        return crypto.randomBytes(byteSize, function (err, salt) {
          if (err) {
            callback(err);
          }
          return callback(null, salt.toString('base64'));
        });
      },

      /**
       * Encrypt password
       *
       * @param {String} password
       * @param {Function} callback
       * @return {String}
       */
      encryptPassword: function (password, callback) {
        if (!password || !this.salt) {
          if (!callback) {
            return null;
          }
          return callback(null);
        }

        var defaultIterations = 10000;
        var defaultKeyLength = 64;
        var salt = new Buffer(this.salt, 'base64');

        if (!callback) {
          return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength)
            .toString('base64');
        }

        return crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength,
          function (err, key) {
            if (err) {
              callback(err);
            }
            return callback(null, key.toString('base64'));
          });
      },

      /**
       * Update password field
       *
       * @param {Function} fn
       * @return {String}
       */
      updatePassword: function (fn) {
        // Handle new/update passwords
        if (this.password) {
          if (!validatePresenceOf(this.password) && authTypes.indexOf(this.provider) === -1) {
            fn(new Error('Invalid password'));
          }

          // Make salt with a callback
          var _this = this;
          this.makeSalt(function (saltErr, salt) {
            if (saltErr) {
              fn(saltErr);
            }
            _this.salt = salt;
            _this.encryptPassword(_this.password, function (encryptErr, hashedPassword) {
              if (encryptErr) {
                fn(encryptErr);
              }
              _this.password = hashedPassword;
              fn(null);
            });
          });
        } else {
          fn(null);
        }
      },

      getIse2FromOrangeIdentity: function () {
        return this.orange && this.orange.identity && this.orange.identity.collectiveidentifier;
      },

      getPublicInfos: function () {
        return User.getPublicInfos(this.get({plain:true}));
      }
    },

    classMethods: {
      getPublicInfos: function (plainUser) {
        plainUser = plainUser || {};
        return {
          nickname: plainUser.nickname,
          facebook: plainUser.facebook ? { id: plainUser.facebook.id } : null
        }
      }
    }
  });

  // Monkey patching:
  //  when calling model.get(options) <= options is tranfered to submodels
  //  we use this implementation to transfer additionnal options like object 'visibility'
  //  to submodels instances
  //  FIXME: we cannot use this yet... too risky & buggy.
  //  FIXME: maybe fork sequelize / use this kind of code later.
  //  FIXME: USER_PRIVACY: maybe use a global output filter instead of this monkey patch.
  /*
  var get = User.Instance.prototype.get;
  User.Instance.prototype.get = function (key, options) {
    console.log('User.get monkey patched...', options);
    if (options && options.plain && options.plain === 'public') {
      var user = get.apply(this, arguments);
      return User.getPublicInfos(user);
    } else {
      return get.apply(this, arguments);
    }
  };
  */

  return User;
};
