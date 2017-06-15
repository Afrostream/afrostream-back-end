module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerSubscriber', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    state: DataTypes.STRING(16), // null|ACTIVE|UNSUBSCRIBED
    referenceType: DataTypes.STRING(32),
    referenceUuid: DataTypes.STRING(64),
    referenceEmail: DataTypes.STRING(255)
  });
};
