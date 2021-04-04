'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost/idea_maker',
  {
    logging: true,
    operatorAliases: false,
    ssl: true
  });

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};
