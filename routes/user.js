'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const User = require('../models/user');
const Word = require('../models/word');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');
const moment = require('moment-timezone');

router.get('/:userId/mywords', authenticationEnsurer, (req, res, next) => {
  const userId = req.params.userId;
  Word.findAll({
    include: [
      {
        model: User,
        attributes: ['username']
      }
    ],
    where: { createdBy: userId },
    order: [['"createdAt"', 'DESC']]
  }).then((words) => {
    words.forEach((word) => {
      word.formattedCreatedAt = moment(word.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
      word.isUpdated = word.createdAt.getTime() < word.updatedAt.getTime();
    });
    res.render('myword', {
      user: req.user,
      words: words
    });
  });
});

router.get('/:userId/favorites', authenticationEnsurer, (req, res, next) => {
  const userId = req.params.userId;
  let storedCombinations = null;
  let storedFavorites = null;
  let storedWordMap = null;
  //閲覧するお気に入り一覧と自分のお気に入り情報を照らし合わせるためのお気に入りマップ
  // const favoriteMap = new Map(); //key: combinationId, value: favorite
  Favorite.findAll({
    where: { userId: userId },
    order: [['"createdAt"', 'DESC']]
  }).then((favorites) => {
    storedFavorites = favorites;
    return Promise.all(favorites.map((f) => {
      return Combination.findById(f.combinationId);
    }));
  }).then((combinations) => {
    storedCombinations = combinations;
    const promises = [];
    combinations.forEach((combination) => {
      // let value = wordMap.get(combination.firstWordId);
      // if (!value) {
      //   Word.findOne({
      //     include: [
      //       {
      //         model: User,
      //         attributes: ['username']
      //       }
      //     ],
      //     where: { wordId: combination.firstWordId }
      //   }).then((word) => {
      //     value = {
      //       word: word.word,
      //       description: word.description,
      //       createdBy: word.createdBy,
      //       username: word.user.username,
      //       isUpdated: word.createdAt < word.updatedAt
      //     };
      //   });
      // }
      // wordMap.set(combination.firstWordId, value);

      const p1 = Word.findOne({
        include: [
          {
            model: User,
            attributes: ['username']
          }
        ],
        where: { wordId: combination.firstWordId }
      });
      const p2 = Word.findOne({
        include: [
          {
            model: User,
            attributes: ['username']
          }
        ],
        where: { wordId: combination.secondWordId }
      });
      promises.push(p1, p2);
    });
    const wordMap = new Map(); //key:wordId, value: Word
    return Promise.all(promises).then((words) => {
      words.forEach((word) => {
        let value = wordMap.get(word.wordId);
        if (!value) {
          value = {
            word: word.word,
            description: word.description,
            createdBy: word.createdBy,
            username: word.user.username,
            formattedCreatedAt: moment(word.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm'),
            isUpdated: word.createdAt.getTime() < word.updatedAt.getTime()
          }
        }
        wordMap.set(word.wordId, value);
      });
      storedWordMap = wordMap;
    });
  }).then(() => {
    const favoriteMap = new Map();
    if (parseInt(req.user.id) === parseInt(userId)) { //自分のお気に入り一覧を見る場合
      storedFavorites.forEach((f) => { favoriteMap.set(f.combinationId, f.favorite); });
      return favoriteMap;
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
        return favoriteMap;
      });
    }
  }).then((favoriteMap) => {
    res.render('favorite', {
      user: req.user,
      combinations: storedCombinations,
      wordMap: storedWordMap,
      favoriteMap: favoriteMap
    });
  });
});

module.exports = router;
