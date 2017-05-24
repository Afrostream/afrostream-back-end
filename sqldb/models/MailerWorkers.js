module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerWorker', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    name: DataTypes.STRING(255)
  });
};
