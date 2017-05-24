module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerAssoProvidersList', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    listId: DataTypes.UUID,
    providerId:  DataTypes.UUID,
    synced: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastSynced: DataTypes.DATE
  });
};
