const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerAssoListsProviders', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    // flags
    automation: DataTypes.INTEGER,
    canReactive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    listId: DataTypes.UUID,
    providerId:  DataTypes.UUID,
    pApiId: DataTypes.STRING,
    /*
     * null / {} = NO STATUS YET.
     *
     * { sync: { id: ..., startedAt: date, finishedAt: date, progress: float } }
     */
    pApiStatus: DataTypes.JSON
  }, {
    instanceMethods : {
      updatePApiStatus: function (newStatus) {
        const current = this.getDataValue('pApiStatus');

        return this.update({
          pApiStatus: _.merge({}, current, newStatus)
        });
      },

      ensureSyncCanProceed: function (syncId) {
        return this.reload()
          .then(asso => {
            const pApiStatus = asso.get('pApiStatus');

            if (!pApiStatus ||
                !pApiStatus.sync ||
                 pApiStatus.sync.id !== syncId) {
              throw new Error('sync stopped ' + JSON.stringify(pApiStatus));
            }
          });
      }
    }
  });
};
