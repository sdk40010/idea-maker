'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Favorite = require('../models/favorite');

router.post('/:userId/combinations/:combinationId', authenticationEnsurer, (req, res, next) => {
  const userId = req.params.userId;
  const combinationId = req.params.combinationId;
  const createdAt = new Date();
  let favorite = req.body.favorite;
  favorite = favorite ? parseInt(favorite) : 0;

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
    Favorite.upsert({
      userId: userId,
      combinationId: combinationId,
      favorite: favorite,
      createdAt: createdAt
    }).then(() => {
      res.json({ status: 'OK', favorite: favorite });
    });
  }
});

module.exports = router;


