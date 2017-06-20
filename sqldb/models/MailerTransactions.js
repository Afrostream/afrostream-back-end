module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerTransaction', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    providerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    listId: DataTypes.UUID,
    subscriberId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    subscriberReferenceUuid: DataTypes.STRING(64),
    subscriberReferenceEmail: DataTypes.STRING(255),
    templateId: DataTypes.UUID,
    openedDate: DataTypes.DATE
  });
};
