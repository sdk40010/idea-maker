var express = require('express');
var router = express.Router();
const Combination = require('../models/combination');

/* GET home page. */
router.get('/', (req, res, next) => {
  if (req.user) {
    Combination.findAll({
      order:[['"combinationId', 'DESC']]
    }).then((combinations) => {
      res.render('index', {
        user: req.user,
        combinations: combinations
      });
    });
  } else {
    res.render('index', { user: req.user });
  }
});

module.exports = router;
