module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerAssoSubscribersProviders', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    state: DataTypes.STRING(16), // null|ACTIVE|UNSUBSCRIBED
    dateActive: DataTypes.DATE,
    dateUnsubscribed: DataTypes.DATE,
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};
