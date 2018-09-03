"use strict";
const mongoose = require('mongoose')
const Media = require('./media')
const logger = require('../logger')
const websockets = require('../websockets')()
const cache = require('memory-cache')
const Scene = require('./scene')

/**
 * Change the Scene title accordingly if the Topic is currently playing
 */
function setTitle (newTitle) {
  if (this.started && !this.ended) {
    let scene = new Scene()
    if (scene.title == this.title) {
      scene.title = newTitle
      scene.save()
    }
  }

  return newTitle
}

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
 *         format: int32
 *         minimum: 1
 *         description: current position inside the parent's list
 *         required: true
 *       started:
 *         type: date
 *         description: time and date when the Topic has started
 *       ended:
 *         type: date
 *         description: time and date when the Topic has ended
 */
let topicSchema = new mongoose.Schema({
    title: { type: String, set: setTitle },
    description: String,
    position: { type: Number, required: true, index: true },
    started: { type: Date },
    ended: { type: Date },
    created: { type: Date, required: true },
    modified: { type: Date, required: true },
    episode: { type: mongoose.Schema.Types.ObjectId, ref:'Episode' },
    medias: [{ type: mongoose.Schema.Types.ObjectId, ref:'Media' }]
})

// when a Topic is removed, delete all its Medias
topicSchema.post('remove', function(topic) {
  logger.debug(`Removed Topic ${topic._id}`)
  websockets.sockets.emit(`topics.${topic._id}.delete`, topic)

  Media
    .find({ topic: topic._id })
    .then(function(medias) {
      medias.forEach(function (media) {
        media.remove()
      })
    })
    .catch(function(error) {
        next(error)
    });
})

topicSchema.pre('save', function(next) {
  this.wasNew = this.isNew
  
  // stop all others topics if this one starts playing
  if (this.isModified('started') && this.started && !this.ended) {
    this.constructor
      .find({ ended : null })
      .where('_id').ne(this._id)
      .where('started').ne(null)
      .then(function(topics) {
        topics.forEach(function (topic) {
          topic.ended = Date.now()
          topic.save()
          Media
            .find({ topic: topic._id })
            .where('started').ne(null)
            .then((medias) => {
              medias.forEach((media) => {
                media.ended = Date.now()
                media.save()
              })
            })
        })
        next()
      })
      .catch(function(error) {
        logger.error(error)
      })
  } else {
    next()
  }
})

topicSchema.post('save', function(topic) {
  if (this.wasNew) {
    logger.debug(`Added a new Topic\n${topic.toString()}`)
    websockets.sockets.emit('topics.add', topic)
  } else {
    logger.debug(`Updated Topic\n${topic.toString()}`)
  }
  websockets.sockets.emit('topics.' + topic._id, topic)
})

module.exports = mongoose.model('Topic', topicSchema)