'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const User = require('../models/user');
const Comment = require('../models/comment');

router.post('/:combinationId/comments', authenticationEnsurer, (req, res, next) => {
  const combinationId = req.params.combinationId;
  const comment = req.body.comment;
  const createdBy = req.user.id;
  let commentNumber = null;
  Comment.count({
    where: { combinationId: combinationId }
  }).then((count) => {
    commentNumber = count + 1; //何番目のコメントか判別する値
  }).then(() => {
    return Comment.create({
      combinationId: combinationId,
      commentNumber: commentNumber,
      comment: comment,
      createdBy: createdBy,
    });
  }).then(() => {
    return Comment.findOne({
      include: [
        {
          model: User,
          attributes: ['userId', 'username']
        }
      ],
      where: { combinationId: combinationId, commentNumber: commentNumber }
    });
  }).then((comment) => {
    res.json({ status: 'OK', comment: comment });
  });
});

router.post('/:combinationId/comments/:commentNumber', authenticationEnsurer, (req, res, next) => {
  const combinationId = req.params.combinationId;
  const commentNumber = req.params.commentNumber;
  Comment.findOne({
    where: { combinationId: combinationId, commentNumber: commentNumber }
  }).then((comment) => {
    return new Promise((resolve) => { //resolveはelseの中にも入れる？
      if (isMine(req, comment)) {
        if (parseInt(req.query.delete) === 1) {
          comment.destroy().then(() => {
            resolve();
          });
        } else {
          const err = new Error('不正なリクエストです');
          err.status = 400;
          next(err);
          res.json({ status: 'Bad Request' });
        }
      } else {
        const err = new Error('指定されたコメントがない、または、編集する権限がありません');
        err.status = 404;
        next(err);
        res.json({ status: 'Not Found' });
      }
    });
  }).then(() => {
    res.json({ status: 'OK' });
  });

});

const isMine = (req, comment) => {
  return comment && parseInt(comment.createdBy) === parseInt(req.user.id);
};

module.exports = router;