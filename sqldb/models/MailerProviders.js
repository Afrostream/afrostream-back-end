module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerProvider', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    name: DataTypes.STRING,
    token: DataTypes.STRING,
    interface: DataTypes.STRING,
    canHandleList: {
      type: DataTypes.BOOLEAN,
      default: false
    }
  });
};
