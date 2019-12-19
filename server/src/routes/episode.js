const express = require('express');
const router = express.Router();
const logger = require('../logger');
const Episode = require('../models/episode')
const Topic = require('../models/topic')
const Media = require('../models/media')
const Scene = require('../models/scene')
const fs = require('fs')
const path = require('path')

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
      const programEpisodes = await Episode.find({ program: req.program._id }).exec()

      // Max episode number + 1 - inspired by https://stackoverflow.com/a/4020842
      const maxEpisodeNumber = programEpisodes.length > 0 ? Math.max.apply(
        Math,
        programEpisodes.map(function(e){
            return e.number
        })
      ) : 0
      episode.number = 1 + maxEpisodeNumber
    }

    episode
      .save()
      .then(function(episode) {
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
    .then(function(episode) {
      if (episode !== null) {
        req.episode = episode
        next()
      } else {
        next({message: `Episode ${value} was not found`, status: 404})
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
          let scene = new Scene()
          scene.episode = null
          scene.topic = null
          scene.media = null
          scene.title = null
          scene.fullscreen = false
          scene.picture = null
          scene.logo = null
          scene.primarycolor = null;
          scene.save()

          res.status(204).json(result.toString())
        } else {
          next({message: `Episode ${req.params.episodeId} wasn't deleted`, status: 417})
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
  req.episode.ended = null
  req.episode
      .save()
      .then(function(episode) {
        logger.debug(`Started Episode\n${episode.toString()}`)
        res.json(episode)

        let scene = new Scene()
        scene.episode = req.episode
        scene.title = episode.name
        scene.topic = null
        scene.fullscreen = false
        scene.media = null
        scene.picture = null
        scene.logo = req.program.logo
        scene.background = req.program.background
        scene.primarycolor = req.program.primarycolor
        scene.save()
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
 *         description: Episode stopped
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
          logger.debug(`Stopped Episode\n${episode.toString()}`)
          res.json(episode)

          let scene = new Scene()
          scene.episode = null
          scene.topic = null
          scene.media = null
          scene.title = null
          scene.fullscreen = false
          scene.picture = null
          scene.logo = null
          scene.primarycolor = null
          scene.save()
        })
        .catch(function(error) {
          next(error)
        })
  } else {
    next({message:`Episode ${req.params.episodeId} cannot be stopped if it isn't playing`, status: 417})
  }
})

/**
 * @swagger
 * /programs/{programId}/episodes/{episodeId}/next:
 *   get:
 *     tags:
 *       - Episodes
 *     description: >
 *       Find the current playing Topic and start its next sibling.
 *       If there is no playing Topic, start the first.
 *       If it is already the last, send an error.
 *     summary: Start the next Episode's topic
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
 *         description: Topic started
 *         schema:
 *           $ref: '#/definitions/Topic'
 */
router.get('/:episodeId/next', function (req, res, next) {
  if (req.episode.started && !req.episode.ended) {
    Topic
        .find({ episode: req.episode._id })
        .sort({ 'position': 1 })
        .then(function(topics) {
          let nextTopic = topics[0]
          for (let i = 0; i < topics.length; i++) {
            if (topics[i].started && !topics[i].ended) {
              if (++i < topics.length) {
                nextTopic = topics[i]
                break
              } else {
                next({message: `Episode ${req.params.episodeId} is at its end`, status: 400})
                return
              }
            }
          }
          nextTopic.started = Date.now()
          nextTopic.ended = null
          nextTopic
            .save()
            .then(function(topicStarted) {
              logger.debug(`Started Topic\n${topicStarted.toString()}`)
              res.json(topicStarted)

              let scene = new Scene()
              scene.topic = topicStarted
              scene.media = null
              scene.title = topicStarted.title
              scene.fullscreen = false
              scene.picture = null
              scene.save()
            })
            .catch(function(error) {
              next(error)
            })
        })
        .catch(function(error) {
          next(error)
        })
  } else {
    next({message:`Episode ${req.params.episodeId} isn't playing`, status: 417})
  }
})

/**
 * @swagger
 * /programs/{programId}/episodes/{episodeId}/clone:
 *   get:
 *     tags:
 *       - Episodes
 *     description: >
 *       Clone the Episode into a new one.
 *       All objects inside the new document have their time reset and aren't playing.
 *     summary: Clone the Episode
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
 *         description: Episode newly created
 *         schema:
 *           $ref: '#/definitions/Episode'
 */
router.get('/:episodeId/clone', async function (req, res, next) {
  // get a new Episode number inside the Program
  const programEpisodes = await Episode.find({ program: req.program._id }).exec()
  const maxEpisodeNumber = programEpisodes.length > 0 ? Math.max.apply(
      Math,
      programEpisodes.map(function(e){
          return e.number
      })
  ) : 0

  let newEpisode = new Episode(Object.assign({}, req.episode.toObject(), {
    _id: undefined,
    __v: undefined,
    name: req.episode.name ? `Copy of ${req.episode.name}` : req.episode.name,
    started: null,
    ended: null,
    number: 1 + maxEpisodeNumber,
    topics: [],
    created: Date.now(),
    modified: Date.now()
  }))
  newEpisode.program = req.program._id

  newEpisode
    .save()
    .then(async (newEpisodeSaved) => {
      /*
       * to make all save synchronous, we chain the 'save' Promises
       */
      function cloneMediasSync(mediaCollection, parentTopic) {
        return mediaCollection.reduce((promise, media) => {
          let newMedia = new Media(Object.assign({}, media.toObject(), {
            _id: undefined,
            __v: undefined,
            started: null,
            ended: null,
            created: Date.now(),
            modified: Date.now(),
            topic: parentTopic._id
          }))

          if (media.path) {
            const pathObject = path.parse(media.path)
            const newFilePath = `${path.join(pathObject.dir, pathObject.name)}-copy${pathObject.ext}`
            fs.copyFileSync(media.path, newFilePath)
            newMedia.path = newFilePath
            newMedia.uri = newFilePath.replace(process.env.DATA_PATH, '/data').replace(/\\/g, path.posix.sep)
          }

          return promise
            .then((result) => {
              return newMedia.save().then((newMediaSaved) => {
              });
            })
            .catch((error) => {
              logger.error(error)
            });
        }, Promise.resolve());
      }

      function cloneTopicsSync(topicCollection, parentEpisode) {
        return topicCollection.reduce(async (promise, topic) => {
          let newTopic = new Topic(Object.assign({}, topic.toObject(), {
            _id: undefined,
            __v: undefined,
            started: null,
            ended: null,
            medias: [],
            created: Date.now(),
            modified: Date.now(),
            episode: parentEpisode._id
          }))

          // get all Topic's Medias
          const medias = await Media
            .find({ topic: topic._id })
            .sort({ 'position': 1 })

          return promise
            .then((result) => {
              return newTopic.save().then((savedTopic) => {
                return cloneMediasSync(medias, savedTopic.toObject())
              });
            })
            .catch((error) => {
              logger.error(error)
            });
        }, Promise.resolve());
      }

      // get all Episode's Topics
      const topics = await Topic
        .find({ episode: req.episode._id })
        .sort({ 'position': 1 })
        .exec()

      cloneTopicsSync(topics, newEpisodeSaved.toObject()).then(() => {
        res.json(newEpisodeSaved)
      })
    })
    .catch((error) => {
      next(error)
    })
})

router.use('/:episodeId/topics', require('./topic'));
router.use('/:episodeId/description', require('./description'));

module.exports = router;