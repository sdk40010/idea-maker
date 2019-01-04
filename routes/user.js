'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Word = require('../models/word');
const moment = require('moment-timezone');

router.get('/:userId/mywords', authenticationEnsurer, (req, res, next) => {
  const userId = req.params.userId;
  Word.findAll({
    where: { createdBy: userId },
    order: [['"createdAt"', 'DESC']]
  }).then((words) => {
    words.forEach((word) => {
      word.formattedCreatedAt = moment(word.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
      word.formattedUpdatedAt = moment(word.updatedAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
    });
    res.render('mywords', {
      user: req.user,
      words: words
    });
  });
});

module.exports = router;
