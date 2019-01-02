'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Favorite = loader.database.define('favorites', {
  userId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  combinationId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  favorite: {
    type: Sequelize.INTEGER,
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


