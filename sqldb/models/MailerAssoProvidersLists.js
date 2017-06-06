module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerAssoProvidersList', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    listId: DataTypes.UUID,
    providerId:  DataTypes.UUID,
    pApiId: DataTypes.STRING,
    pApiStatus: DataTypes.JSON
  });
};
