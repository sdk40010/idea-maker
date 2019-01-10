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