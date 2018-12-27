'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Word = require('../models/word');
const Combination = require('../models/combination');

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.post('/', authenticationEnsurer, (req, res, next) => {
  let newWord = null;
  Word.create({
    word: req.body.word,
    description: req.body.description,
    createdBy: req.user.id
  }).then((word) => {
    newWord = word;
    return Word.findAll();
  }).then((words) => {
    if (words.length >= 2) {
      let combinations = [];
      for (let i = 0; i < words.length - 1; i++) {
        combinations.push({
          combination: [newWord.word, words[i].word],
          descriptions: [newWord.description, words[i].description],
          firstWordId: newWord.wordId,
          secondWordId: words[i].wordId
        });
      }
      Combination.bulkCreate(combinations).then(() => {
        res.redirect('/');
      })
    } else {
      res.redirect('/');
    }
  })
});

module.exports = router;

