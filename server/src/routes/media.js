"use strict";
const express = require('express')
const router = express.Router()
const logger = require('../logger')
const Media = require('../models/media')
const Topic = require('../models/topic')
const XSplit = require('../models/xsplit')
const path = require('path')
const multer = require('multer')
const uuidv4 = require('uuid/v4')
const fs = require('fs')
const request = require('request-promise')
const mime = require('mime')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsPath = process.env.DATA_PATH + '/uploads'
    if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath)
    cb(null, uploadsPath)
  },
  filename: function (req, file, cb) {
    cb(null, path.basename(file.originalname, path.extname(file.originalname)).replace(/\s/g, "_") + '-' + uuidv4() + path.extname(file.originalname))
  }
})
const upload = multer({ 
  storage: storage,
  limits: { 
    fieldSize: 10 * 1024 * 1024 // 10 MB
  }
})

/**
 * @swagger
 * definitions:
 *   Media:
 *     properties:
 *       label:
 *         type: string
 *         description: Media's label
 *       uri:
 *         type: string
 *         description: Path to the media file
 *         required: true
 *       started:
 *         type: date
 *         description: time and date when the Media has started
 *       ended:
 *         type: date
 *         description: time and date when the Media has ended
 */

router.route('/')
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/medias:
   *   get:
   *     tags:
   *       - Media
   *     description: Return all medias from an topic
   *     summary: Get all medias
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
   *         description: An array of medias
   *         schema:
   *           type: array
   *           items:
   *             $ref: '#/definitions/Media'
   */
  .get(function(req, res, next) {
    Media
        .find({ topic: req.topic._id })
        .sort({ 'position': 1 })
        .then(function(medias) {
            res.json(medias)
        })
        .catch(function(error) {
            next(error)
        });
  })
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/medias:
   *   post:
   *     tags:
   *       - Media
   *     description: Create a new media
   *     summary: Add a media
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
   *       - name: media
   *         in: body
   *         description: Fields for the Media resource
   *         schema:
   *           type: array
   *           $ref: '#/definitions/Media'
   *       - name: file
   *         in: formData
   *         description: The actual media (picture, video, anything)
   *         type: file
   *     responses:
   *       200:
   *         description: Successfully created
   *         schema:
   *           $ref: '#/definitions/Media'
   */
  .post(upload.single('file'), async function (req, res, next) {
    "use strict";
    let media = new Media(Object.assign(req.body, {created: Date.now(), modified: Date.now()}))
    media.topic = req.topic._id

    if (req.file) {
      logger.debug('Receive a file : ')
      logger.debug(req.file)
      // provide a label if the user didn't specified one
      if (typeof media.label === "undefined") { // something is wrong, the label cannot be sent in the request body
        media.label = req.file.originalname
      }
      media.path = req.file.path
      media.uri = '/' + media.path // should be calculate automatically from the path instead
      media.mimeType = req.file.mimetype
    } else if (media.uri) { // otherwise, tries to download the file and place it under the data directory
      let response = await request({uri: media.uri, encoding: 'binary', resolveWithFullResponse: true})
      let mimeType = response.headers['content-type']
      let uploadsPath = process.env.DATA_PATH + '/uploads'
      if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath)
      let filepath = uploadsPath + '/' + path.basename(media.uri.split('?')[0], path.extname(media.uri)).replace(/\s/g, "_") + '-' + uuidv4() + '.' + mime.getExtension(mimeType)
      fs.writeFileSync(path.resolve(filepath), response.body, 'binary')

      if (typeof media.label === "undefined") media.label = path.basename(media.uri)
      media.path = filepath
      media.uri = '/' + media.path // should be calculate automatically from the path instead
      media.mimeType = mimeType
    } else {
      next({message:"No media file or URI was provided", status: 417})
    }

    // provide a position if the user didn't specified one
    if (typeof media.position === "undefined") {
      var topicMedias = await Media.find({ topic: req.topic._id }).exec()

      // Max media position + 1 - inspired by https://stackoverflow.com/a/4020842
      var maxMediaPosition = topicMedias.length > 0 ? Math.max.apply(
          Math,
          topicMedias.map(function(m){
              return m.position;
          })
      ) : 0;
      media.position = 1 + maxMediaPosition;
    }

    media
      .save()
      .then(function(media) {
        logger.debug("Added a new Media " + media.toString())
        // add media to topic to retrieve them all by using 'populate'
        req.topic.medias.push(media)
        req.topic.save()

        res.json(media)
      })
      .catch(function(error) {
        next(error)
      })
  })

// Middleware : we check if the media exists in the specified topic before going further
router.param('mediaId', function (req, res, next, value, name) {
  Media
    .findOne({_id: value, topic: req.topic._id})
    .then(function(media) {
      if (media !== null) {
        req.media = media
        next()
      } else {
        next({message:"Media " + value + " was not found", status: 404})
      }
    })
    .catch(function(error) {
      next(error)
    })
})

router.route('/:mediaId')
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/medias/{mediaId}:
   *   get:
   *     tags:
   *       - Media
   *     description: Return a single media
   *     summary: Get a media
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
   *       - name: mediaId
   *         description: Media's id
   *         in: path
   *         required: true
   *         type: uuid
   *     responses:
   *       200:
   *         description: A single Media
   *         schema:
   *           $ref: '#/definitions/Media'
   */
  .get(function (req, res, next) {
    res.send(req.media)
  })
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/medias/{mediaId}:
   *   put:
   *     tags:
   *       - Media
   *     description: Update a single media
   *     summary: Edit a media
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
   *       - name: mediaId
   *         description: Media's id
   *         in: path
   *         required: true
   *         type: uuid
   *       - name: media
   *         in: body
   *         description: Fields for the Media resource
   *         schema:
   *           type: array
   *           $ref: '#/definitions/Media'
   *     responses:
   *       200:
   *         description: Successfully updated
   *         schema:
   *           $ref: '#/definitions/Media'
   */
  .put(function (req, res, next) {
    delete req.body.started
    delete req.body.ended
    
    req.media = Object.assign(req.media, req.body, {modified: Date.now()})
    req.media
      .save()
      .then(function(media) {
        logger.debug("Updated " + media.toString())
        res.json(media)
      })
      .catch(function(error) {
        next(error)
      })
  })
  /**
   * @swagger
   * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/medias/{mediaId}:
   *   delete:
   *     tags:
   *       - Media
   *     description: Delete a single media
   *     summary: Remove a media
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
   *       - name: mediaId
   *         description: Media's id
   *         in: path
   *         required: true
   *         type: uuid
   *     responses:
   *       204:
   *         description: Successfully deleted
   */
  .delete(function (req, res, next) {
    req.media
      .remove()
      .then(function(result) {
        if (result !== null) {
          logger.debug("Removed Media " + req.params.mediaId)
          res.status(204).json(result.toString())
        } else {
          next({message:"Media " + req.params.mediaId + " wasn't deleted", status: 417})
        }
      })
      .catch(function(error) {
        next(error)
      })
  })

/**
 * @swagger
 * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/medias/{mediaId}/start:
 *   get:
 *     tags:
 *       - Media
 *     description: Start playing media
 *     summary: Start a media
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
 *       - name: mediaId
 *         description: Media's id
 *         in: path
 *         required: true
 *         type: uuid
 *     responses:
 *       200:
 *         description: Media started
 *         schema:
 *           $ref: '#/definitions/Media'
 */
router.get('/:mediaId/start', function (req, res, next) {
  let xsplit = new XSplit()
  req.media.started = Date.now()
  req.media
      .save()
      .then(function(media) {
        logger.debug("Started " + media.toString())
        res.json(media)

        xsplit.picture = req.media.uri
        xsplit.save()
      })
      .catch(function(error) {
        next(error)
      })

  // we start the parent Topic if it isn't already
  if (!(req.topic.started && !req.topic.ended)) {
    req.topic.started = Date.now()
    req.topic.ended = null
    req.topic.save()

    xsplit.title = req.topic.title
    xsplit.save()
  }

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
 * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/medias/{mediaId}/stop:
 *   get:
 *     tags:
 *       - Media
 *     description: Stop playing media
 *     summary: Stop a media
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
 *       - name: mediaId
 *         description: Media's id
 *         in: path
 *         required: true
 *         type: uuid
 *     responses:
 *       200:
 *         description: Media stooped
 *         schema:
 *           $ref: '#/definitions/Media'
 */
router.get('/:mediaId/stop', function (req, res, next) {
  req.media.ended = Date.now()
  req.media
      .save()
      .then(function(media) {
        logger.debug("Stopped " + media.toString())
        var xsplit = new XSplit()
        xsplit.picture = null
        xsplit.save()
        res.json(media)
      })
      .catch(function(error) {
        next(error)
      })
})

/**
 * @swagger
 * /programs/{programId}/episodes/{episodeId}/topics/{topicId}/medias/{mediaId}/move:
 *   get:
 *     tags:
 *       - Media
 *     description: Move a media to a new position and reindex the whole list
 *     summary: Move a media
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
 *       - name: mediaId
 *         description: Media's id
 *         in: path
 *         required: true
 *         type: uuid
 *       - name: position
 *         description: New Media's position
 *         in: query
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: All Topic's Medias
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/definitions/Media'
 */
router.get('/:mediaId/move', async function (req, res, next) {
  if (!req.query.position) {
    next({message:"A new position is needed to perform a move", status: 417, example: '/move?position=10'})
  }

  var newPosition = parseInt(req.query.position)

  var topicMedias = await Media.find({ topic: req.topic._id }).sort({ 'position': 1 }).exec()
  for (var i = 0; i < topicMedias.length; i++) {
    if (topicMedias[i]._id.equals(req.media._id)) {
      var mediaToMove = topicMedias[i]
      topicMedias.splice(i, 1)
      topicMedias.splice(newPosition, 0, mediaToMove)
      break
    }
  }

  if (mediaToMove) {
    for (var i = 0; i < topicMedias.length; i++) {
      topicMedias[i].position = i
      topicMedias[i].save()
    }

    res.json(topicMedias)
  } else {
    next({message:"Couldn't move the Media at the new position " + newPosition, status: 500})
  }
})

module.exports = router;