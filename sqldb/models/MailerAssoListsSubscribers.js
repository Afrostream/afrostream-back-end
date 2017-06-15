module.exports = function (sequelize, DataTypes) {
  return sequelize.define('MailerAssoListsSubscribers', {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    state: DataTypes.STRING(16), // null|ACTIVE|UNSUBSCRIBED
    dateActive: DataTypes.DATE,
    dateUnsubscribed: DataTypes.DATE,
    listId: DataTypes.UUID,
    subscriberId:  DataTypes.UUID
  });
};
