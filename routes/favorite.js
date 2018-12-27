'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Favorite = require('../models/favorite');

router.post('/:userId/combinations/:combinationId', authenticationEnsurer, (req, res, next) => {
  const userId = req.params.userId;
  const combinationId = req.params.combinationId;
  const combination = req.body['combination[]'];
  const descriptions = req.body['descriptions[]'];
  const createdAt = new Date();

  console.log(req.body);

  Favorite.upsert({
    userId: userId,
    combinationId: combinationId,
    combination: combination,
    descriptions: descriptions,
    createdAt: createdAt
  }).then(() => {
    res.json({ status: 'OK' });
  });
});

module.exports = router;


