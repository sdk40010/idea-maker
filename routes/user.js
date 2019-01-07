'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Word = require('../models/word');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');
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
    res.render('myword', {
      user: req.user,
      words: words
    });
  });
});

router.get('/:userId/favorites', authenticationEnsurer, (req, res, next) => {
  const userId = req.params.userId;
  let storedCombinations = [];
  let storedFavorites = null;
  //閲覧するお気に入り一覧と自分のお気に入り情報を照らし合わせるためのお気に入りマップ
  const favoriteMap = new Map(); //key: combinationId, value: favorite
  Favorite.findAll({
    where: { userId: userId },
    order: [['"createdAt"', 'DESC']]
  }).then((favorites) => {
    storedFavorites = favorites;
    return Promise.all(favorites.map((f) => {
      return Combination.findById(f.combinationId).then((combination) => {storedCombinations.push(combination); });
    }));
  }).then(() => {
    if (parseInt(req.user.id) === parseInt(userId)) { //自分のお気に入り一覧を見る場合
      storedFavorites.forEach((f) => { favoriteMap.set(f.combinationId, f.favorite); });
    } else { //他人のお気に入り一覧を見る場合
      return Favorite.findAll({ 
        where: { userId: req.user.id }
      }).then((favorites) => {
        favorites.forEach((f) => {
          favoriteMap.set(f, combinationId, f.favorite);
        });
        storedCombinations.forEach((s) => {
          const f = favoriteMap.get(s.combinationId) || 0;
          favoriteMap.set(s.combinationId, f);
        });
      });
    }
  }).then(() => {
    res.render('favorite', {
      user: req.user,
      combinations: storedCombinations,
      favoriteMap: favoriteMap
    });
  });
});

module.exports = router;
