'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Combination = require('../models/combination');
const Favorite = require('../models/favorite');

router.get('/:combination', authenticationEnsurer, (req, res, next) => {
  Combination.findById(req.params.combinationId).then((combination) => {
    // Favorite.findAll({
    //   where: {combinationId: req.params.combinationId} //favoriteモデルにcombinatonIdのインデックスを追加
    // }).then((favorites) => {
    //   let isMyFavorite = null;
    //   favorites.forEach((f) => {
    //     if (f.userId === req.user.id) {
          
    //     }
    //   })
    // })

    res.render('combination', {
      combination: combination
    });
  });
});


