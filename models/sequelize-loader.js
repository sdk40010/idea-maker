'use strict';
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
  'postgres://postgres:postgres@localhost/idea_maker',
  {
    logging: true,
    operatorAliases: false
  });

module.exports = {
  database: sequelize,
  Sequelize: Sequelize
};
