'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');

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
      //お気に入りカウンターの数字を1減らす
      return Combination.findById(combinationId);
    }).then((combination) => {
      return combination.update({
        favoriteCounter: combination.favoriteCounter - 1
      });
    }).then((updatedCombination) => {
      res.json({ status: 'OK', favorite: favorite, favoriteCounter: updatedCombination.favoriteCounter });
    });
  } else if(favorite === 1){
    //お気に入りに追加されたら、データベースにお気に入り情報を保存する
    Favorite.create({
      userId: userId,
      combinationId: combinationId,
      favorite: favorite,
      createdAt: createdAt
    }).then(() => {
      //お気に入りカウンターの数値を1増やす
      return Combination.findById(combinationId);
    }).then((combination) => {
      return combination.update({
        favoriteCounter: combination.favoriteCounter + 1
      });
    }).then((updatedCombination) => {
      res.json({ status: 'OK', favorite: favorite , favoriteCounter: updatedCombination.favoriteCounter});
    });
  }
});

module.exports = router;


