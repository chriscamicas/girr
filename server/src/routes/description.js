"use strict";
const express = require('express')
const router = express.Router()
const logger = require('../logger')
const Topic = require('../models/topic')
const Episode = require('../models/episode')

router.route('/')
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/description:
   *   get:
   *     tags:
   *       - Topic
   *     description: Return a description from all topic title from an episode
   *     summary: Get an episode description
   *     produces: application/json
   *     parameters:
   *       - name: programId
   *         description: Program's id
   *         in: path
   *         required: true
   *         type: uuid
   *       - name: episodeId
   *         description: Episode's id
   *         in: path
   *         required: true
   *         type: uuid
   *     responses:
   *       200:
   *         description: A description for the episode
   *         schema:
   *           type: string
   */
  .get(function(req, res, next) {
    Topic
      .find({ episode: req.episode._id })
      .sort({ 'position': 1 })
      .select({ title: 1, _id: 0 })
      .then(function(topics) {
        res.send(topics.map(t => t.title).join('\n'))
      })
      .catch(function(error) {
        next(error)
      });
  })

module.exports = router;