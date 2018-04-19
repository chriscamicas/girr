const express = require('express');
const router = express.Router();
const logger = require('../logger');
const Episode = require('../models/episode')
const Topic = require('../models/topic')
const Media = require('../models/media')
const XSplit = require('../models/xsplit')

/**
 * @swagger
 * definitions:
 *   Episode:
 *     properties:
 *       number:
 *         type: integer
 *         description: unique identifier in the Program
 *         required: true
 *       name:
 *         type: string
 *         description: name
 *       date:
 *         type: date
 *         description: when an episode air
 */

router.route('/')
  /**
   * @swagger
   * /programs/{programId}/episodes:
   *   get:
   *     tags:
   *       - Episodes
   *     description: Return all episodes from a program
   *     summary: Get all episodes
   *     produces: application/json
   *     parameters:
   *       - name: programId
   *         description: Program's id
   *         in: path
   *         required: true
   *         type: uuid
   *     responses:
   *       200:
   *         description: An array of episodes
   *         schema:
   *           type: array
   *           items:
   *             $ref: '#/definitions/Episode'
   */
  .get(function(req, res, next) {
    Episode
        .find({ program: req.program._id })
        // .populate({ path: 'program', select: 'name' })
        .sort({ 'number': -1 })
        .then(function(episodes) {
            res.json(episodes)
        })
        .catch(function(error) {
            next(error)
        });
  })
  /**
   * @swagger
   * /programs/{programId}/episodes:
   *   post:
   *     tags:
   *       - Episodes
   *     description: Create a new episode
   *     summary: Add a new one
   *     produces: application/json
   *     parameters:
   *       - name: programId
   *         description: Program's id
   *         in: path
   *         required: true
   *         type: uuid
   *       - name: episode
   *         in: body
   *         description: Fields for the Episode resource
   *         schema:
   *           type: array
   *           $ref: '#/definitions/Episode'
   *     responses:
   *       200:
   *         description: Successfully created
   *         schema:
   *           $ref: '#/definitions/Episode'
   */
  .post(async function (req, res, next) {
    "use strict";
    delete req.body.started
    delete req.body.ended

    let episode = new Episode(Object.assign(req.body, {created: Date.now(), modified: Date.now()}))
    episode.program = req.program._id
    
    // provide a number if the user didn't specified one
    if (typeof episode.number === "undefined") {
      var programEpisodes = await Episode.find({ program: req.program._id }).exec()

      // Max episode number + 1 - inspired by https://stackoverflow.com/a/4020842
      var maxEpisodeNumber = programEpisodes.length > 0 ? Math.max.apply(
          Math,
          programEpisodes.map(function(e){
              return e.number
          })
      ) : 0
      episode.number = 1 + maxEpisodeNumber
    }

    // provide a name if the user didn't specified one
    if (typeof episode.name === "undefined") {
        episode.name = "Episode #" + episode.number;
    }

    episode
        .save()
        .then(function(episode) {
            logger.debug("Added a new Episode " + episode.toString())
            // add episode to program to retrieve them all by using 'populate'
            req.program.episodes.push(episode)
            req.program.save()

            res.json(episode)
        })
        .catch(function(error) {
            next(error)
        })
  })

// Middleware : we check if the episode exists in the specified program before going further
router.param('episodeId', function (req, res, next, value, name) {
  Episode
    .findOne({_id: value, program: req.program._id})
    // .populate({ 
    //   path: 'topics',
    //   // options: {
    //   //   sort: { position: 1 }
    //   // },
    //   populate: {
    //     path: 'medias',
    //     model: 'Media'
    //   } 
    // })
    .then(function(episode) {
      if (episode !== null) {
        req.episode = episode
        next()
      } else {
        next({message:"Episode " + value + " was not found", status: 404})
      }
    })
    .catch(function(error) {
      next(error)
    })
})

router.route('/:episodeId')
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}:
   *   get:
   *     tags:
   *       - Episodes
   *     description: Return a single episode
   *     summary: Get a episode
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
   *         description: A single Episode
   *         schema:
   *           $ref: '#/definitions/Episode'
   */
  .get(function (req, res, next) {
    res.send(req.episode)
  })
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}:
   *   put:
   *     tags:
   *       - Episodes
   *     description: Update a single episode
   *     summary: Edit a episode
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
   *       - name: episode
   *         in: body
   *         description: Fields for the Episode resource
   *         schema:
   *           type: array
   *           $ref: '#/definitions/Episode'
   *     responses:
   *       200:
   *         description: Successfully updated
   *         schema:
   *           $ref: '#/definitions/Episode'
   */
  .put(function (req, res, next) {
    delete req.body.started
    delete req.body.ended
    
    req.episode = Object.assign(req.episode, req.body, {modified: Date.now()})
    req.episode
      .save()
      .then(function(episode) {
        logger.debug("Updated " + episode.toString())
        res.json(episode)
      })
      .catch(function(error) {
        next(error)
      })
  })
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}:
   *   delete:
   *     tags:
   *       - Episodes
   *     description: Delete a single episode
   *     summary: Remove a episode
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
   *       204:
   *         description: Successfully deleted
   */
  .delete(function (req, res, next) {
    req.episode
      .remove()
      .then(function(result) {
        if (result !== null) {
          logger.debug("Removed Episode " + req.params.episodeId)
          res.status(204).json(result.toString())
        } else {
          next({message:"Episode " + req.params.episodeId + " wasn't deleted", status: 417})
        }
      })
      .catch(function(error) {
        next(error)
      })
  })

/**
 * @swagger
 * /programs/{programId}/episodes/{episodeId}/start:
 *   get:
 *     tags:
 *       - Episodes
 *     description: Start playing episode
 *     summary: Start a episode
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
 *         description: Episode started
 *         schema:
 *           $ref: '#/definitions/Episode'
 */
router.get('/:episodeId/start', function (req, res, next) {
  req.episode.started = Date.now()
  req.episode
      .save()
      .then(function(episode) {
        logger.debug("Started " + episode.toString())
        res.json(episode)

        let xsplit = new XSplit()
        xsplit.title = episode.name
        xsplit.picture = null
        xsplit.logo = req.program.logoBW
        xsplit.save()
      })
      .catch(function(error) {
        next(error)
      })
})

/**
 * @swagger
 * /programs/{programId}/episodes/{episodeId}/stop:
 *   get:
 *     tags:
 *       - Episodes
 *     description: Stop playing episode
 *     summary: Stop a episode
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
 *         description: Episode stooped
 *         schema:
 *           $ref: '#/definitions/Episode'
 */
router.get('/:episodeId/stop', function (req, res, next) {
  if (req.episode.started && !req.episode.ended) {
    req.episode.ended = Date.now()
    req.episode
        .save()
        .then(function(episode) {
          Topic
            .find({ episode: req.episode._id, ended: null })
            .where('started').ne(null)
            .then(function(topics) { // we end all topics that are playing
              topics.forEach(function (playingTopic) {
                playingTopic.ended = Date.now()
                playingTopic
                  .save()
                  .then(function(stoppedTopic) {
                     Media
                      .find({ topic: stoppedTopic._id, ended: null })
                      .where('started').ne(null)
                      .then(function(medias) { // we end all medias that are playing
                        medias.forEach(function (playingMedia) {
                          playingMedia.ended = Date.now()
                          playingMedia.save()
                        })
                      })
                      .catch(function(error) {
                        logger.error(error)
                      })
                  })
              })
            })
            .catch(function(error) {
              logger.error(error)
            })
          logger.debug("Stopped " + episode.toString())
          res.json(episode)

          let xsplit = new XSplit()
          xsplit.title = null
          xsplit.picture = null
          xsplit.logo = null
          xsplit.save()
        })
        .catch(function(error) {
          next(error)
        })
  } else {
    next({message:"Episode " + req.params.episodeId + " cannot be stopped if it isn't playing", status: 417})
  }
})

router.use('/:episodeId/topics', require('./topic'));

module.exports = router;