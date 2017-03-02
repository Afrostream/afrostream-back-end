const config = rootRequire('config');

const Tenant = rootRequire('sqldb').Tenant;

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Item', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    tenantId: {
      type: DataTypes.INTEGER,
      references: {
        model: Tenant,
        key: '_id'
      }
    },
    // backward compatibility api-v1
    oldId: DataTypes.INTEGER,
    oldUuid: DataTypes.UUID,
    oldType: DataTypes.STRING(32),
    //
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: DataTypes.TEXT,
    translations: DataTypes.JSONB,
    slug: DataTypes.STRING(255),
    //
    active: DataTypes.BOOLEAN,
    dateFrom: DataTypes.DATE,
    dateTo: DataTypes.DATE,
    countries: DataTypes.ARRAY(DataTypes.STRING(2)),
    broadcasters: DataTypes.ARRAY(DataTypes.STRING(4))
  }, {
    getterMethods : {
      sharing: function()  {
        return { url: config.frontEnd.protocol + '://' + config.frontEnd.authority + '/sharing/item/' + this._id };
      }
    }
  });
};
