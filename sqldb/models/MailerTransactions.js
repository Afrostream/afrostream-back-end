module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerTransaction', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    listId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    providerReferenceUuid: DataTypes.STRING(64),
    workerId: DataTypes.UUID,
    templateId: DataTypes.UUID,
    email: DataTypes.STRING,
    metadata: DataTypes.JSON,
    // stats
    sendToProviderDate: DataTypes.DATE,
    sentDate: DataTypes.DATE,
    openedDate: DataTypes.DATE
  });
};
