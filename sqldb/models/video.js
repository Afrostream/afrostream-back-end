'use strict';

var config = rootRequire('/config');

var Q = require('q');

var pf = rootRequire('/pf.js');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Video', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      primaryKey: true
    },
    name: DataTypes.STRING,
    importId: DataTypes.INTEGER,
    encodingId: {
      type: DataTypes.STRING,
      length: 36
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    drm: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    duration: {
      type: DataTypes.DECIMAL,
      // there is no sequelize equivalent to postgresql type "NUMERIC"
      // when using DECIMAL or DOUBLE, equelize will convert postgresql NUMERIC into STRING
      // we want a float.
      get : function () {
        return parseFloat(this.getDataValue('duration'));
      }
    },
    pfMd5Hash: DataTypes.STRING(32),
    countries: DataTypes.ARRAY(DataTypes.STRING(2)),
    broadcasters: DataTypes.ARRAY(DataTypes.STRING(4))
  }, {
    getterMethods   : {
      sharing: function()  {
        return { url: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/sharing/video/' + this._id }
      }
    },

    instanceMethods: {
      /**
       * null on error
       */
      computeVXstY: function () { // disabled
        return Q(null);
        /*
        var c = {
          pfLanguages: [],        // languages referenced in PF.
          captionsLanguages: []   // languages referenced in backend database.
        };

        console.log('[INFO]: [vXstY]: auto on ' + this._id);

        var that = this;

        return Q()
          .then(function () {
            // ensure we can request PF
            if (!that.pfMd5Hash) {
              throw new Error('cannot determine vXstY without pfMd5Hash');
            }
            return pf.getAssetsStreamsSafe(that.pfMd5Hash, pf.profiles.VIDEO0ENG_AUDIO0ENG_USP);
          })
          .then(function (assets) {
            if (!Array.isArray(assets)) {
              console.log(assets);
              throw new Error('malformed assets');
            }
            var languages = assets.filter(function (asset) {
              return asset.type === 'audio';
            }).map(function (asset) {
              return asset.language;
            });
            if (languages.length === 0) {
              throw new Error('missing assets');
            }
            c.pfLanguages = languages;
          })
          .then(function () {
            // searching for subtitles.
            return that.getCaptions();
          })
          .then(function (captions) {
            return Q.all(captions.map(function (caption) {
              return caption.getLang();
            }));
          })
          .then(function (captionsLangs) {
            c.captionsLanguages = captionsLangs.map(function (lang) {
              return lang.ISO6392T;
            })
          })
          .then(function () {
            var vXstYs = [];
            // ANALYSING THE RESULT
            if (c.pfLanguages.indexOf('fra') ||
                c.pfLanguages.indexOf('fre')) {
              vXstYs.push('VF');
            }
            var noFra = c.pfLanguages.filter(function (l) {
              return l !== 'fra' && l !== 'fre';
            });
            if (noFra.length > 0) {
              // VO, VOST, VOSTFR
              if (c.captionsLanguages.indexOf('fra') ||
                  c.captionsLanguages.indexOf('fre')) {
                vXstYs.push('VOSTFR');
              } else if (c.captionsLanguages.length > 0) {
                vXstYs.push('VOST');
              } else {
                vXstYs.push('VO');
              }
            }
            return vXstYs.join(',') || null;
          })
          .then(function (vXstY) {
            console.log('[INFO]: [vXstY]: auto on '+that._id + ' result=' + vXstY);
            return vXstY;
          }, function (err) {
            console.error('[ERROR]: [vXstY]: auto on '+that._id+' error='+err.message);
            return null;
          });
          */
      }
    }
  });
};
