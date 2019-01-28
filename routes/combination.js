'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const User = require('../models/user');
const Word = require('../models/word');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');
const Comment = require('../models/comment');
const moment = require('moment-timezone');

router.get('/:combinationId', authenticationEnsurer, (req, res, next) => {
  let storedCombination = null;
  let storedFavoriteInfo = null;
  let storedComments = null;
  Combination.findById(req.params.combinationId).then((combination) => {
    storedCombination = combination;
    return Favorite.findOne({
      where: { userId: req.user.id, combinationId: combination.combinationId }
    });
  }).then((f) => {
    storedFavoriteInfo = f ? f.favorite : 0; //お気に入りの組み合わせかどうか
    return Comment.findAll({
      include: [
        {
          model: User,
          attributes: ['username']
        }
      ],
      where: { combinationId: req.params.combinationId },
      order: [['"createdAt"', 'DESC']]
    });
  }).then((comments) => {
    comments.forEach((comment) => {
      comment.formattedCreatedAt = moment(comment.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
    });
    storedComments = comments;
    const p1 = Word.findById(storedCombination.firstWordId, {
      include: [
        {
          model: User,
          attributes: ['username']
        }
      ]
    });
    const p2 = Word.findById(storedCombination.secondWordId, {
      include: [
        {
          model: User,
          attributes: ['username']
        }
      ]
    });
    return Promise.all([p1, p2]);
  }).then((words) => {
    //組み合わせに使われている単語からワードMap（キー:ワードID, 値:ワード）を作成する
    const wordMap = new Map(); //key: wordId, value: Word
    words.forEach((word) => {
      wordMap.set(word.wordId, {
        word: word.word,
        description: word.description,
        createdBy: word.createdBy,
        username: word.user.username,
        formattedCreatedAt: moment(word.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm'),
        isUpdated: word.createdAt.getTime() < word.updatedAt.getTime()
      });
    });
    res.render('combination', {
      user: req.user,
      combination: storedCombination,
      favoriteInfo: storedFavoriteInfo,
      comments: storedComments,
      wordMap: wordMap
    });
  });
});

module.exports = router;


