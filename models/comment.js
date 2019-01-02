'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Comment = loader.database.define('comments', {
  combinationId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  commentNumber: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    alliwNull: false
  },
  comment: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  createdBy: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false
  }
}, {
    freezeTableName: true,
    timestamps: true
  });

module.exports = Comment;