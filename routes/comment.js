'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const User = require('../models/user');
const Comment = require('../models/comment');
const moment = require('moment-timezone');

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
    comment.formattedCreatedAt = moment(comment.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
    comment.formattedupdatedAt = moment(comment.updatedAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
    res.json({ status: 'OK', comment: comment });
  });
});

module.exports = router;