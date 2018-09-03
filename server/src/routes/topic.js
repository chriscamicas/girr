"use strict";
const express = require('express')
const router = express.Router()
const logger = require('../logger')
const Topic = require('../models/topic')
const Media = require('../models/media')
const Episode = require('../models/episode')
const Scene = require('../models/scene')

router.route('/')
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics:
   *   get:
   *     tags:
   *       - Topic
   *     description: Return all topic from an episode
   *     summary: Get all topic
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
   *         description: An array of topics
   *         schema:
   *           type: array
   *           items:
   *             $ref: '#/definitions/Topic'
   */
  .get(function(req, res, next) {
    Topic
      .find({ episode: req.episode._id })
      .sort({ 'position': 1 })
      .then(function(topics) {
        res.json(topics)
      })
      .catch(function(error) {
        next(error)
      });
  })
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics:
   *   post:
   *     tags:
   *       - Topic
   *     description: Create a new topic
   *     summary: Add a topic
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
   *       - name: topic
   *         in: body
   *         description: Fields for the Topic resource
   *         schema:
   *           type: array
   *           $ref: '#/definitions/Topic'
   *     responses:
   *       200:
   *         description: Successfully created
   *         schema:
   *           $ref: '#/definitions/Topic'
   */
  .post(async function (req, res, next) {
    delete req.body.started
    delete req.body.ended

    let topic = new Topic(Object.assign(req.body, {created: Date.now(), modified: Date.now()}))
    topic.episode = req.episode._id

    // provide a position if the user didn't specified one
    if (typeof topic.position === "undefined") {
      const episodeTopics = await Topic.find({ episode: req.episode._id }).exec()

      // Max topic position + 1 - inspired by https://stackoverflow.com/a/4020842
      const maxTopicNumber = episodeTopics.length > 0 ? Math.max.apply(
        Math,
        episodeTopics.map(function(t){
            return t.position;
        })
      ) : 0;
      topic.position = 1 + maxTopicNumber;
    }

    topic
      .save()
      .then(function(topic) {
        res.json(topic)
      })
      .catch(function(error) {
        next(error)
      })
  })

// Middleware : we check if the topic exists in the specified episode before going further
router.param('topicId', function (req, res, next, value, name) {
  delete req.body.started
  delete req.body.ended

  Topic
    .findOne({_id: value, episode: req.episode._id})
    .then(function(topic) {
      if (topic !== null) {
        req.topic = topic
        next()
      } else {
        next({message: `Topic ${value} was not found`, status: 404})
      }
    })
    .catch(function(error) {
      next(error)
    })
})

router.route('/:topicId')
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics/{topicId}:
   *   get:
   *     tags:
   *       - Topic
   *     description: Return a single topic
   *     summary: Get a topic
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
   *       - name: topicId
   *         description: Topic's id
   *         in: path
   *         required: true
   *         type: uuid
   *     responses:
   *       200:
   *         description: A single Topic
   *         schema:
   *           $ref: '#/definitions/Topic'
   */
  .get(function (req, res, next) {
    res.send(req.topic)
  })
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics/{topicId}:
   *   put:
   *     tags:
   *       - Topic
   *     description: Update a single topic
   *     summary: Edit a topic
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
   *       - name: topicId
   *         description: Topic's id
   *         in: path
   *         required: true
   *         type: uuid
   *       - name: topic
   *         in: body
   *         description: Fields for the Topic resource
   *         schema:
   *           type: array
   *           $ref: '#/definitions/Topic'
   *     responses:
   *       200:
   *         description: Successfully updated
   *         schema:
   *           $ref: '#/definitions/Topic'
   */
  .put(function (req, res, next) {
    delete req.body.started
    delete req.body.ended
    
    req.topic = Object.assign(req.topic, req.body, {modified: Date.now()})
    req.topic
      .save()
      .then(function(topic) {
        res.json(topic)
      })
      .catch(function(error) {
        next(error)
      })
  })
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics/{topicId}:
   *   delete:
   *     tags:
   *       - Topic
   *     description: Delete a single topic
   *     summary: Remove a topic
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
   *       - name: topicId
   *         description: Topic's id
   *         in: path
   *         required: true
   *         type: uuid
   *     responses:
   *       204:
   *         description: Successfully deleted
   */
  .delete(function (req, res, next) {
    req.topic
      .remove()
      .then(function(result) {
        if (result !== null) {
          res.status(204).json(result.toString())
        } else {
          next({message: `Topic ${req.params.topicId} wasn't deleted`, status: 417})
        }
      })
      .catch(function(error) {
        next(error)
      })
  })

/**
 * @swagger
 * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/start:
 *   get:
 *     tags:
 *       - Topic
 *     description: Start a topic
 *     summary: Start a topic
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
 *       - name: topicId
 *         description: Topic's id
 *         in: path
 *         required: true
 *         type: uuid
 *     responses:
 *       200:
 *         description: Topic started
 *         schema:
 *           $ref: '#/definitions/Topic'
 */
router.get('/:topicId/start', function (req, res, next) {
  req.topic.started = Date.now()
  req.topic.ended = null
  req.topic
    .save()
    .then(function(topicStarted) {
      logger.debug(`Started Topic\n${topicStarted.toString()}`)

      res.json(topicStarted)

      let scene = new Scene()
      scene.topic = topicStarted
      scene.title = topicStarted.title
      scene.media = null // no content should be displayed when cast start talking about a Topic
      scene.picture = null

      // we start the parent Episode if it isn't already
      if (!(req.episode.started && !req.episode.ended)) {
        req.episode.started = Date.now()
        req.episode.ended = null
        req.episode.save()

        scene.logo = req.program.logoBW
        scene.episode = req.episode
      }
      scene.save()
    })
    .catch(function(error) {
      next(error)
    })
})

/**
 * @swagger
 * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/stop:
 *   get:
 *     tags:
 *       - Topic
 *     description: Stop a topic
 *     summary: Stop a topic
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
 *       - name: topicId
 *         description: Topic's id
 *         in: path
 *         required: true
 *         type: uuid
 *     responses:
 *       200:
 *         description: Topic stopped
 *         schema:
 *           $ref: '#/definitions/Topic'
 */
router.get('/:topicId/stop', function (req, res, next) {
  // we should probably checked if it is actually playing before stopping it

  req.topic.ended = Date.now()
  req.topic
      .save()
      .then(function(topic) {
        Media
          .find({ topic: req.topic._id, ended: null })
          .where('started').ne(null)
          .then(function(results) { // we end all medias that are playing
            results.forEach(function (media) {
              media.ended = Date.now()
              media.save()
            })
          })
          .catch(function(error) {
            logger.error(error)
          })
        let scene = new Scene()
        scene.topic = null
        scene.media = null
        scene.title = req.episode.name
        scene.picture = null
        scene.save()

        logger.debug(`Stopped Topic\n${topic.toString()}`)
        res.json(topic)
      })
      .catch(function(error) {
        next(error)
      })

  
})

/**
 * @swagger
 * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/move:
 *   get:
 *     tags:
 *       - Topic
 *     description: Move a topic to a new position and reindex the whole list
 *     summary: Move a topic
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
 *       - name: topicId
 *         description: Topic's id
 *         in: path
 *         required: true
 *         type: uuid
 *       - name: position
 *         description: New Topic's position
 *         in: query
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: All Episode's Topics
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Topic'
 */
router.get('/:topicId/move', async function (req, res, next) {
  if (!req.query.position) {
    next({message: 'A new position is needed to perform a move', status: 417, example: '/move?position=10'})
  }

  const newPosition = parseInt(req.query.position)

  let episodeTopics = await Topic.find({ episode: req.episode._id }).sort({ 'position': 1 }).exec()
  for (let i = 0; i < episodeTopics.length; i++) {
    if (episodeTopics[i]._id.equals(req.topic._id)) {
      var topicToMove = episodeTopics[i]
      episodeTopics.splice(i, 1)
      episodeTopics.splice(newPosition, 0, topicToMove)
      break
    }
  }

  if (topicToMove) {
    for (let i = 0; i < episodeTopics.length; i++) {
      episodeTopics[i].position = i
      episodeTopics[i].save()
    }

    res.json(episodeTopics)
  } else {
    next({message: `Couldn't move the Topic at the new position ${newPosition}`, status: 500})
  }
})

router.use('/:topicId/medias', require('./media'));

module.exports = router;