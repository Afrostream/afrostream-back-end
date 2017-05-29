module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerTemplate', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    subject: DataTypes.TEXT,
    text: DataTypes.TEXT,
    html: DataTypes.TEXT
  });
};
