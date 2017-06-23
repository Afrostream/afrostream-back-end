module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerList', {
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
    query: DataTypes.TEXT,
    numberOfSubscribers: {
      type: DataTypes.INTEGER,
      default: 0
    },
    cron: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });
};
