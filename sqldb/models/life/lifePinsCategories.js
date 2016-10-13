'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('LifePinsCategories', {
        _id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        label: DataTypes.STRING,
        slug: DataTypes.STRING,
        sort: DataTypes.INTEGER,
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        instanceMethods: {
            setPinsOrdered: sqldb.generateInstanceMethodSetXOrdered({
                // mandatory
                linkModel: 'LifePinsCategories',
                linkColumnSrc: 'CategoryId',
                linkColumnDst: 'MovieId',
                linkColumnSrcIndex: 'movieOrder',
                linkColumnDstIndex: 'categoryOrder'
                dstModel: 'Movie',
                // optional
                srcIdColumn: '_id',
                dstIdColumn: '_id'
            })
        }
    });
};
