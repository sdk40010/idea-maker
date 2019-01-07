var express = require('express');
var router = express.Router();
const User = require('../models/user');
const Word = require('../models/word');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');
const moment = require('moment-timezone');

/* GET home page. */
router.get('/', (req, res, next) => {
  if (req.user) {
    let storedCombinations = null;
    let storedFavoriteMap = null;
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
      storedCombinations.forEach((c) => {
        const f = favoriteMap.get(c.combinationId) || 0; //デフォルト値は0を利用
        favoriteMap.set(c.combinationId, f);
      });
      storedFavoriteMap = favoriteMap;
    }).then(() => {
      return Word.findAll({
        include: [
          {
            model: User,
            attributes: ['userId', 'username']
          }
        ],
        order: [['"wordId"', 'DESC']]
      });
    }).then((words) => {
      //全ての単語からワードMap（キー:ワードID, 値:ワード）を作成する
      const wordMap = new Map(); //key: wordId, value: Word
      words.forEach((word) => {
        wordMap.set(word.wordId, {
          createdBy: word.user.userId,
          username: word.user.username,
          formattedCreatedAt: moment(word.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm'),
          isUpdated: word.createdAt.getTime() < word.updatedAt.getTime() //その単語が更新されているか
        });
      });
      res.render('index', {
        user: req.user,
        combinations: storedCombinations,
        favoriteMap: storedFavoriteMap,
        wordMap: wordMap
      });
    });
  } else {
    res.render('index', { user: req.user });
  }
});

module.exports = router;
