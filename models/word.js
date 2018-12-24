'use strict';
const loader = require('./sequelize-loader');
const Sequelize = loader.Sequelize;

const Word = loader.database.define('words', {
  wordId: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  word: {
    type: Sequelize.STRING(20),
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  createdBy: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
}, {
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        fields: ['createdBy']
      }
    ]
  });

module.exports = Word;

