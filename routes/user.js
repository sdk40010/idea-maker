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
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

router.get('/:userId/mywords', authenticationEnsurer, csrfProtection, (req, res, next) => {
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
      words: words,
      csrfToken: req.csrfToken()
    });
  });
});

router.get('/:userId/favorites', authenticationEnsurer, (req, res, next) => {
  const userId = req.params.userId;
  let storedCombinations = null;
  let storedFavorites = null;
  let storedWordMap = null;
  let storedFavoriteMap = null;
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
    //組み合わせに使われている単語からワードMapを作成
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
          };
        }
        wordMap.set(word.wordId, value);
      });
      storedWordMap = wordMap;
    });
  }).then(() => {
    //お気に入りマップ(キー:組み合わせID, 値:お気に入り情報)を作成する
    const favoriteMap = new Map(); //key: combinationId, value: favorite
    storedFavorites.forEach((f) => { favoriteMap.set(f.combinationId, f.favorite); });
    storedFavoriteMap = favoriteMap;
    return Promise.all(storedCombinations.map(sc => Comment.findOne({
      where: {combinationId: sc.combinationId, createdBy: req.user.id}
    })));
  }).then((comments) => {
    //コメントマップ（キー:組み合わせID, 値:コメント情報）を作成する
    const commentMap = new Map(); //key: combinationId, value: comment
    comments.forEach((comment) => {
      if (comment) commentMap.set(comment.combinationId, 1);
    });
    //コメント情報がない組み合わせに、閲覧ユーザーがコメントしていないことを示す「0」を設定する
    storedCombinations.forEach((sc) => {
      const value = commentMap.get(sc.combinationId) || 0;
      commentMap.set(sc.combinationId, value);
    });
    res.render('favorite', {
      user: req.user,
      combinations: storedCombinations,
      wordMap: storedWordMap,
      favoriteMap: storedFavoriteMap,
      commentMap: commentMap
    });
  })
});

module.exports = router;
