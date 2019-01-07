'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Word = require('../models/word');
const Combination = require('../models/combination');

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.post('/', authenticationEnsurer, (req, res, next) => {
  let newWord = null;
  Word.create({
    word: req.body.word,
    description: req.body.description,
    createdBy: req.user.id
  }).then((word) => {
    newWord = word;
    return Word.findAll();
  }).then((words) => {
    //新しく追加された単語と既存の単語の組み合わせを作成する
    if (words.length >= 2) {
      let combinations = [];
      for (let i = 0; i < words.length - 1; i++) {
        combinations.push({
          combination: [newWord.word, words[i].word],
          descriptions: [newWord.description, words[i].description],
          firstWordId: newWord.wordId,
          secondWordId: words[i].wordId
        });
      }
      Combination.bulkCreate(combinations).then(() => {
        res.redirect('/');
      })
    } else {
      res.redirect('/');
    }
  })
});

router.get('/:wordId/edit', authenticationEnsurer, (req, res, next) => {
  const wordId = req.params.wordId;
  Word.findOne({
    where: { wordId: wordId }
  }).then((word) => {
    if (isMine(req, word)) { //作成者のみが編集フォームを開ける
      res.render('edit', {
        user: req.user,
        word: word
      });
    } else {
      const err = new Error('指定された単語がない、または、編集する権限がありません');
      err.status = 404;
      next(err);
    }
  });
});

const isMine = (req, word) => {
  return word && parseInt(word.createdBy) === parseInt(req.user.id);
};

router.post('/:wordId', authenticationEnsurer, (req, res, next) => {
  Word.findById(req.params.wordId).then((word) => {
    if (isMine(req, word)) {
      if (parseInt(req.query.edit) === 1) {
        word.update({
          description: req.body.description,
        }).then(() => {
          //組み合わせの説明も更新
          return Combination.findAll({
            where: { firstWordId: word.wordId },
            order: [['"combinationId"', 'DESC']]
          }).then((combinations) => {
            return Promise.all(combinations.map((c) => {
              c.update({
                descriptions: [word.description, c.descriptions[1]]
              });
            }));
          });
        }).then(() => {
          return Combination.findAll({
            where: { secondWordId: word.wordId },
            order: [['"combinationId"', 'DESC']]
          }).then((combinations) => {
            return Promise.all(combinations.map((c) => {
              c.update({
                descriptions: [c.descriptions[0], word.description]
              });
            }));
          });
        }).then(() => {
          res.redirect(`/users/${req.user.id}/mywords`);
        });
      } else if (parseInt(req.query.delete) === 1) {
        let storedCombinations = null;
        //削除したい単語が使われている組み合わせを見つける
        Combination.findAll({
          where: { firstWordId: word.wordId }
        }).then((combinations) => {
          //お気に入りもコメントもついていない組み合わせだけを取り出す
          storedCombinations = combinations.filter(c => c.favoriteCounter === 0 && c.commentCounter === 0);
          return Combination.findAll({
            where: { secondWordId: word.wordId }
          });
        }).then((combinations) => {
          return storedCombinations.concat(combinations.filter(c => c.favoriteCounter === 0 && c.commentCounter === 0));
        }).then((deleteCombinations) => {
          return Promise.all(deleteCombinations.map(dc => dc.destroy()));
        }).then(() => {
          return word.destroy();
        }).then(() => {
          res.redirect(`/users/${req.user.id}/mywords`);
        });
      } else {
        const err = new Error('不正なリクエストです');
        err.status = 400;
        next(err);
      }
    } else {
      const err = new Error('指定された単語がない、または、編集する権限がありません');
      err.status = 404;
      next(err);
    }
  });
});

module.exports = router;

