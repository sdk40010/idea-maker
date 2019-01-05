'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const User = require('../models/user');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');
const Comment = require('../models/comment');
const moment = require('moment-timezone');

router.get('/:combinationId', authenticationEnsurer, (req, res, next) => {
  let storedCombination = null;
  let storedFavoriteInfo = null;
  Combination.findById(req.params.combinationId).then((combination) => {
      storedCombination = combination;
      return Favorite.findOne({
        where: { userId: req.user.id, combinationId: combination.combinationId }
      });
    }).then((f) => {
      storedFavoriteInfo = f ? f.favorite : 0; //お気に入りの組み合わせかどうか
      return Comment.findAll({
        include: [
          {
            model: User,
            attributes: ['userId', 'username']
          }
        ],
        where: { combinationId: req.params.combinationId },
        order: [['"createdAt"', 'DESC']]
      });
    }).then((comments) => {
      comments.forEach((comment) => {
        comment.formattedCreatedAt = moment(comment.createdAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
      });
      res.render('combination', {
        user: req.user,
        combination: storedCombination,
        favoriteInfo: storedFavoriteInfo,
        comments: comments
      });
    })
});

module.exports = router;


