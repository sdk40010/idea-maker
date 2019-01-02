'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Word = require('../models/word');
const Favorite = require('../models/favorite');
const moment = require('moment-timezone');

router.post('/:userId/combinations/:combinationId', authenticationEnsurer, (req, res, next) => {
  const userId = req.params.userId;
  const combinationId = req.params.combinationId;
  const createdAt = new Date();
  const favorite = parseInt(req.body.favorite);

  if (favorite === 0) {
    //お気に入りから削除されたら,データベースからお気に入り情報を削除する
    Favorite.findOne({
      where: { userId: userId, combinationId: combinationId }
    }).then((favorite) => {
      return favorite.destroy();
    }).then(() => {
      res.json({ status: 'OK', favorite: 0 });
    });
  } else {
    //お気に入りに追加されたら、データベースにお気に入り情報を保存する
    Favorite.create({
      userId: userId,
      combinationId: combinationId,
      favorite: favorite,
      createdAt: createdAt
    }).then(() => {
      res.json({ status: 'OK', favorite: favorite });
    });
  }
});

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


