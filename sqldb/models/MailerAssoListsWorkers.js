module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerAssoListsWorkers', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    listId: DataTypes.UUID,
    workerId:  DataTypes.UUID
  });
};
