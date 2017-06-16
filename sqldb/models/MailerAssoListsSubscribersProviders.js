module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerAssoListsSubscribersProviders', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    //
    listId: DataTypes.UUID,
    subscriberId: DataTypes.UUID,
    providerId: DataTypes.UUID,
    //
    pApiId: DataTypes.STRING,
    pApiState: DataTypes.STRING,
    //
    state: DataTypes.STRING(16), // null
                                 // ACTIVE | UNSUBSCRIBED
                                 // P-ACTIVE | P-UNSUBSCRIBED  (pending)
                                 // E-ACTIVE | E-UNSUBSCRIBED  (error)
    dateActive: DataTypes.DATE,
    dateUnsubscribed: DataTypes.DATE,
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    instanceMethods : {
      subscriberCanBeCreatedInProviderAPI: function () {
        return this.state === null ||
               this.state === 'E-ACTIVE'; // retry
      },

      susbcriberCanBeDeletedInProviderAPI: function () {
        return this.state === 'ACTIVE' ||
               this.state === 'E-UNSUBSCRIBED'; // retry
      }
    }
  });
};
