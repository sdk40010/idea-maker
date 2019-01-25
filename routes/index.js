'use strict';
var express = require('express');
var router = express.Router();
const User = require('../models/user');
const Word = require('../models/word');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');
const Comment = require('../models/comment');
const moment = require('moment-timezone');

/* GET home page. */
router.get('/', (req, res, next) => {
  if (req.user) {
    let storedCombinations = null;
    let storedFavoriteMap = null;
    let storedWordMap = null;
    Combination.findAll({
      order: [['"combinationId', 'DESC']]
    }).then((combinations) => {
      storedCombinations = combinations;
      //閲覧ユーザーのお気に入り情報（どの組み合わせをお気に入りに追加しているか）を取得する
      return Favorite.findAll({
        where: { userId: req.user.id },
        order: [['"combinationId"', 'DESC']]
      });
    }).then((favorites) => {
      //お気に入りMap(キー:組み合わせID, 値:お気に入り情報)を作成する
      const favoriteMap = new Map(); //key: combinationId, value: favorite
      favorites.forEach((f) => {
        favoriteMap.set(f.combinationId, f.favorite);
      });
      //お気に入り情報がない組み合わせに、お気に入りでないことを表す「0」を設定する
      storedCombinations.forEach((sc) => {
        const f = favoriteMap.get(sc.combinationId) || 0; //デフォルト値は0を利用
        favoriteMap.set(sc.combinationId, f);
      });
      storedFavoriteMap = favoriteMap;
    }).then(() => {
      return Word.findAll({
        include: [
          {
            model: User,
            attributes: ['username']
          }
        ],
        order: [['"wordId"', 'DESC']]
      });
    }).then((words) => {
      //全ての単語からワードMap（キー:ワードID, 値:ワード）を作成する
      const wordMap = new Map(); //key: wordId, value: Word
      words.forEach((word) => {
        wordMap.set(word.wordId, {
          word: word.word,
          description: word.description,
          createdBy: word.createdBy,
          username: word.user.username,
          formattedCreatedAt: moment(word.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm'),
          isUpdated: word.createdAt.getTime() < word.updatedAt.getTime() //その単語が更新されているか
        });
      });
      storedWordMap = wordMap;
      //閲覧ユーザーのコメント情報（どの組み合わせにコメントしているか）を取得する
      return Comment.findAll({
        where: { createdBy: req.user.id },
        order: [['"combinationId"', 'DESC']]
      });
    }).then((comments) => {
      //コメントMap（キー:組み合わせID, 値:コメント情報）を作成する
      const commentMap = new Map(); //key: combinationId, value: comment
      comments.forEach((comment) => {
        const value = commentMap.get(comment.combinationId) || 1; 
        commentMap.set(comment.combinationId, value);
      });
      //コメント情報がない組み合わせに、閲覧ユーザーがコメントしていないことを示す「0」を設定する
      storedCombinations.forEach((sc) => {
        const value = commentMap.get(sc.combinationId) || 0; //デフォルト値は0を利用
        commentMap.set(sc.combinationId, value);
      });
      res.render('index', {
        user: req.user,
        combinations: storedCombinations,
        favoriteMap: storedFavoriteMap,
        wordMap: storedWordMap,
        commentMap: commentMap
      });
    })
  } else {
    res.render('index', { user: req.user });
  }
});

module.exports = router;
