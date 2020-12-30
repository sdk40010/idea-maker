'use strict';
var express = require('express');
var router = express.Router();
const User = require('../models/user');
const Word = require('../models/word');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');
const Comment = require('../models/comment');
const { Op } = require('sequelize');
const moment = require('moment-timezone');


/* GET home page. */
router.get('/', (req, res, next) => {
  if (req.user) {
    let storedCombinations = null;
    let storedFavoriteMap = null;
    let storedWordMap = null;
    const page = {
      current: 0,
      max: 0
    };
    const perPage = 10; // 1ページあたりの表示件数

    const pagePromise = new Promise(resolve => {
      if (req.query.page) {
        page.current = Math.max(req.query.page, 1); // 1以下のページ数を修正
      } else {
        page.current = 1;
      }
      Combination.count().then(count => {
        page.max = Math.ceil(count / perPage);
        page.current = Math.min(page.current, page.max); // 最大値を超えるページ数を修正
        resolve();
      });
    });
    
    pagePromise.then(() => {
      return Combination.findAll({
        order: [['"combinationId', 'DESC']],
        offset: (page.current - 1) * perPage,
        limit: perPage
      });
    }).then((combinations) => {
      storedCombinations = combinations;
      //閲覧ユーザーのお気に入り情報（どの組み合わせをお気に入りに追加しているか）を取得する
      const combinationIdList = combinations.map(c => c.combinationId);
      return Favorite.findAll({
        where: {
          userId: req.user.id,
          combinationId: {
            [Op.or]: [combinationIdList]
          }
        },
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

      //閲覧ユーザーのコメント情報（どの組み合わせにコメントしているか）から、コメントMap（キー: 組み合わせID, 値: コメント情報）を作成する
      const commentMap = new Map(); //key: combinationId, value: comment
      const promises= storedCombinations.map(sc => {
        return Comment.count({
          where: { combinationId: sc.combinationId, createdBy: req.user.id }
        }).then((counter) => {
          if (counter > 0) commentMap.set(sc.combinationId, 1);
          //閲覧ユーザーがコメントしていないことを示す「0」を設定する
          else if (counter === 0) commentMap.set(sc.combinationId, 0);
        });
      });
      return Promise.all(promises).then(() => commentMap);
    }).then((commentMap) => {
      res.render('index', {
        user: req.user,
        combinations: storedCombinations,
        favoriteMap: storedFavoriteMap,
        wordMap: storedWordMap,
        commentMap: commentMap,
        page: page
      });
      console.log("page: " + page);
    })
  } else {
    res.render('index', { user: req.user });
  }
});

module.exports = router;
