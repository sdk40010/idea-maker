'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const User = require('../models/user');
const Combination = require('../models/combination');
const Comment = require('../models/comment');
const moment = require('moment-timezone');

router.post('/:combinationId/comments', authenticationEnsurer, (req, res, next) => {
  const combinationId = req.params.combinationId;
  const comment = req.body.comment;
  const createdBy = req.user.id;
  const createdAt = new Date();
  let commentNumber = null;
  let storedComment = null;
  Comment.findOne({
    where: { combinationId: combinationId },
    order: [['"createdAt"', 'DESC']]
  }).then((latestComment) => {
    if (latestComment) commentNumber = latestComment.commentNumber + 1; //何番目のコメントか判別する値
    else commentNumber = 1; //最初のコメント
  }).then(() => {
    return Comment.create({
      combinationId: combinationId,
      commentNumber: commentNumber,
      comment: comment,
      createdBy: createdBy,
      createdAt: createdAt
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
    comment.dataValues.formattedCreatedAt = moment(comment.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
    storedComment = comment;
    return Combination.findById(combinationId);
  }).then((combination) => {
    return combination.update({
      commentCounter: combination.commentCounter + 1
    });
  }).then((updatedCombination) => {
    res.json({ status: 'OK', comment: storedComment, user: req.user, commentCounter: updatedCombination.commentCounter });
  });
});

router.get("/:combinationId/comments", authenticationEnsurer, (req, res, next) => {
  const combinationId = req.params.combinationId
  
  Comment.findAll({
    include: [
      {
        model: User,
        attributes: ["username"]
      }
    ],
    where: { combinationId: combinationId },
    order: [["createdAt", "DESC"]]
  }).then(comments => {
    comments.forEach((comment) => {
      comment.dataValues.formattedCreatedAt = moment(comment.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
    });
    res.json({status: 'OK', comments: comments, user: req.user});
  });
});

router.post('/:combinationId/comments/:commentNumber', authenticationEnsurer, (req, res, next) => {
  const combinationId = req.params.combinationId;
  const commentNumber = req.params.commentNumber;
  Comment.findOne({
    where: { combinationId: combinationId, commentNumber: commentNumber }
  }).then((comment) => {
    return new Promise((resolve) => {
      if (isMine(req, comment)) {
        if (parseInt(req.query.delete) === 1) {
          comment.destroy().then(() => {
            resolve();
          });
        } else {
          const err = new Error('不正なリクエストです');
          err.status = 400;
          next(err);
        }
      } else {
        const err = new Error('指定されたコメントがない、または、編集する権限がありません');
        err.status = 404;
        next(err);
      }
    });
  }).then(() => {
    return Combination.findById(combinationId);
  }).then((combination) => {
    return combination.update({
      commentCounter: combination.commentCounter - 1
    });
  }).then((updatedCombination) => {
    res.json({ status: 'OK', commentCounter: updatedCombination.commentCounter });
  });

});

const isMine = (req, comment) => {
  return comment && parseInt(comment.createdBy) === parseInt(req.user.id);
};

module.exports = router;