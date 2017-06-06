module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerProvider', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      length: 255
    },
    token: {
      type: DataTypes.STRING,
      length: 255
    },
    canHandleList: {
      type: DataTypes.BOOLEAN,
      default: false
    }
  });
};
