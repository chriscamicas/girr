"use strict";
const express = require('express')
const router = express.Router()
const logger = require('../logger')
const Topic = require('../models/topic')
const Media = require('../models/media')
const Episode = require('../models/episode')
const XSplit = require('../models/xsplit')

/**
 * @swagger
 * definitions:
 *   Topic:
 *     properties:
 *       title:
 *         type: string
 *         description: Topic's title
 *       description:
 *         type: string
 *         description: Some notes that should be useful
 *       position:
 *         type: integer
 *         description: current position, because it can moved
 *         required: true
 *       started:
 *         type: date
 *         description: time and date when the Topic has started
 *       ended:
 *         type: date
 *         description: time and date when the Topic has ended
 */

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

    var topic = new Topic(Object.assign(req.body, {created: Date.now(), modified: Date.now()}))
    topic.episode = req.episode._id

    // provide a title if the user didn't specified one
    if (typeof topic.title === "undefined") {
        topic.title = "Untitled topic"
    }

    // provide a position if the user didn't specified one
    if (typeof topic.position === "undefined") {
        var episodeTopics = await Topic.find({ episode: req.episode._id }).exec()

        // Max topic position + 1 - inspired by https://stackoverflow.com/a/4020842
        var maxTopicNumber = episodeTopics.length > 0 ? Math.max.apply(
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
            logger.debug("Added a new Episode " + topic.toString())
            // add topic to episode to retrieve them all by using 'populate'
            req.episode.topics.push(topic)
            req.episode.save()

            res.json(topic)
        })
        .catch(function(error) {
            next(error)
        })
  })

// Middleware : we check if the topic exists in the specified program before going further
router.param('topicId', function (req, res, next, value, name) {
  delete req.body.started
  delete req.body.ended

  Topic
    .findOne({_id: value, episode: req.episode._id})
    // .populate('medias')
    .then(function(topic) {
      if (topic !== null) {
        req.topic = topic
        next()
      } else {
        next({message:"Topic " + value + " was not found", status: 404})
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
        logger.debug("Updated " + topic.toString())
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
          logger.debug("Removed Topic " + req.params.topicId)
          res.status(204).json(result.toString())
        } else {
          next({message:"Topic " + req.params.topicId + " wasn't deleted", status: 417})
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
  let xsplit = new XSplit()
  req.topic.started = Date.now()
  req.topic.ended = null
  req.topic
    .save()
    .then(function(topicStarted) {
      logger.debug("Started " + topicStarted.toString())

      xsplit.title = req.topic.title
      xsplit.picture = null
      xsplit.save()
      res.json(topicStarted)
    })
    .catch(function(error) {
      next(error)
    })

  // we start the parent Episode if it isn't already
  if (!(req.episode.started && !req.episode.ended)) {
    req.episode.started = Date.now()
    req.episode.ended = null
    req.episode.save()

    xsplit.logo = req.program.logoBW
    xsplit.save()
  }
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
        var xsplit = new XSplit()
        xsplit.title = req.episode.name
        xsplit.picture = null
        xsplit.save()

        logger.debug("Started " + topic.toString())
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
    next({message:"A new position is needed to perform a move", status: 417, example: '/move?position=10'})
  }

  var newPosition = parseInt(req.query.position)

  var episodeTopics = await Topic.find({ episode: req.episode._id }).sort({ 'position': 1 }).exec()
  for (var i = 0; i < episodeTopics.length; i++) {
    if (episodeTopics[i]._id.equals(req.topic._id)) {
      var topicToMove = episodeTopics[i]
      episodeTopics.splice(i, 1)
      episodeTopics.splice(newPosition, 0, topicToMove)
      break
    }
  }

  if (topicToMove) {
    for (var i = 0; i < episodeTopics.length; i++) {
      episodeTopics[i].position = i
      episodeTopics[i].save()
    }

    res.json(episodeTopics)
  } else {
    next({message:"Couldn't move the Topic at the new position " + newPosition, status: 500})
  }
})

router.use('/:topicId/medias', require('./media'));

module.exports = router;