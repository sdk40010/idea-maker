'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Favorite = loader.database.define('favorites', {
  userId: {
    type: Sequelize.INTEGER,
    primarykey: true,
    allowNull: false
  },
  combinationId: {
    type: Sequelize.INTEGER,
    primarykey: true,
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
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false
  }
}, {
    freezeTableName: true,
    timestamps: false
  });

module.exports = Favorite;
