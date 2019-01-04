'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Combination = loader.database.define('combinations', {
  combinationId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  combination: {
    type: Sequelize.ARRAY(Sequelize.STRING(20)),
    allowNull: false
  },
  descriptions: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false
  },
  favoriteCounter: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  commentCounter: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  firstWordId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  secondWordId: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['firstWordId', 'secondWordId']
      }
    ]
  });

module.exports = Combination;