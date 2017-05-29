module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerSubscriber', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    referenceUuid: DataTypes.STRING(255),
    referenceEmail: DataTypes.STRING(255)
  });
};
