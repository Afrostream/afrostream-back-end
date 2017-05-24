module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerList', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      length: 255
    },
    query: DataTypes.TEXT,
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};
