'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Word = require('../models/word');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');
const Comment = require('../models/comment');

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
      if (parseInt(req.query.edit) === 1) { //単語の編集
        word.update({
          description: req.body.description,
        }).then(() => {
          res.redirect(`/users/${req.user.id}/mywords`);
        });
      } else if (parseInt(req.query.delete) === 1) { //単語の削除
        deleteWordAggregate(word).then(() => {
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

const deleteWordAggregate = (word) => {
  //削除したい単語が使われている組み合わせを見つける
  const promise1 = Combination.findAll({
    where: { firstWordId: word.wordId }
  }).then((combinations) => {
    const promises = [];
    //お気に入り情報とコメントの削除
    combinations.map((combination) => {
      const p1 = Favorite.findAll({
        where: { combinationId: combination.combinationId }
      }).then((favorites) => {
        return Promise.all(favorites.map(favorite => favorite.destroy()));
      });
      const p2 = Comment.findAll({
        where: { combinationId: combination.combinationId }
      }).then((comments) => {
        return Promise.all(comments.map(comment => comment.destroy()));
      });
      promises.push(p1, p2);
    });
    return Promise.all(promises).then(() => {
      //組み合わせの削除
      Promise.all(combinations.map(combination => combination.destroy()));
    });
  });

  const promise2 = Combination.findAll({
    where: { secondWordId: word.wordId }
  }).then((combinations) => {
    const promises = [];
    //お気に入り情報とコメントの削除
    combinations.map((combination) => {
      const p1 = Favorite.findAll({
        where: { combinationId: combination.combinationId }
      }).then((favorites) => {
        return Promise.all(favorites.map(favorite => favorite.destroy()));
      });
      const p2 = Comment.findAll({
        where: { combinationId: combination.combinationId }
      }).then((comments) => {
        return Promise.all(comments.map(comment => comment.destroy()));
      });
      promises.push(p1, p2);
    });
    return Promise.all(promises).then(() => {
      //組み合わせの削除
      return Promise.all(combinations.map(combination => combination.destroy()));
    });
  });
  //単語の削除
  return Promise.all([promise1, promise2]).then(() => word.destroy());
};

router.deleteWordAggregate = deleteWordAggregate;

module.exports = router;

