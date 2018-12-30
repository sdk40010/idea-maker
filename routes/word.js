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
  Word.findOne({
    where: { wordId: req.params.wordId　}
  }).then((word) => {
    if (isMine(req, word)) {
      if (parseInt(req.query.edit) === 1) {
        console.log('テスト');
        const updatedAt = new Date();
        word.update({
          wordId: word.wordId,
          word: word.word,
          description: req.body.description,
          createdBy: req.user.id,
          updatedAt: updatedAt
        }).then(() => {
          //組み合わせの説明も更新
          return updateDescriptionOfCombination(word, 'first');
        }).then(() => {
          return updateDescriptionOfCombination(word, 'second');
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

const updateDescriptionOfCombination = (wordObj, firstOrSecond) => {
  return new Promise((resolve) => {
    if (firstOrSecond === 'first') {
      Combination.findAll({
        where: { firstWordId: wordObj.wordId },
        order: [['"combinationId"', 'DESC']]
      }).then((combinations) => {
        return Promise.all(combinations.map((c) => {
          c.update({ //returnなしでも大丈夫か確かめる
            combinationId: c.combinationId,
            combination: c.combination,
            descriptions: [wordObj.description, c.descriptions[1]],
            firstWordId: c.firstWordId,
            secondWordId: c.secondWordId
          });
        }));
      }).then(() => {
        resolve();
      });
    } else if (firstOrSecond === 'second') {
      Combination.findAll({
        where: { secondWordId: wordObj.wordId },
        order: [['"combinationId"', 'DESC']]
      }).then((combinations) => {
        return Promise.all(combinations.map((c) => {
          c.update({ //returnなしでも大丈夫か確かめる
            combinationId: c.combinationId,
            combination: c.combination,
            descriptions: [c.descriptions[0], wordObj.description],
            firstWordId: c.firstWordId,
            secondWordId: c.secondWordId
          });
        }));
      }).then(() => {
        resolve();
      });
    }
  });
};

module.exports = router;

