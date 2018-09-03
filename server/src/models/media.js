"use strict";
const mongoose = require('mongoose')
const logger = require('../logger')
const fs = require('fs')
const path  = require('path')
const websockets = require('../websockets')()

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
 *       mimeType:
 *         type: string
 *         description: mime type of the file
 *       position:
 *         type: integer
 *         format: int32
 *         minimum: 1
 *         description: current position inside the parent's list
 *       started:
 *         type: date
 *         description: time and date when the Media has started
 *       ended:
 *         type: date
 *         description: time and date when the Media has ended
 */
let mediaSchema = new mongoose.Schema({
  label: { type: String },
  uri: { type: String, required: true},
  mimeType: { type: String, required: true},
  path: { type: String }, // this should always be the absolute path to the file
  position: { type: Number },
  started: { type: Date },
  ended: { type: Date },
  created: { type: Date, required: true },
  modified: { type: Date, required: true },
  topic: { type: mongoose.Schema.Types.ObjectId, ref:'Topic', required: true },
})

mediaSchema.methods.toJSON = function() {
 let obj = this.toObject()
 delete obj.path // remove/hide the local path
 return obj
}

// when a Media should be removed, delete its local file
mediaSchema.pre('remove', function(next) {
  if (this.path) {
    const filepath = path.isAbsolute(this.path) ? this.path : path.join(__base, this.path)
    if (fs.existsSync(filepath)) {
      logger.debug(`Removing file at ${filepath}`)
      fs.unlinkSync(filepath)
    }
  }
  next()
})

mediaSchema.post('remove', function(media) {
  logger.debug(`Removed Media ${media._id}`)
  websockets.sockets.emit('medias.' + media._id + '.delete', media)
})

mediaSchema.pre('save', function(next) {
  this.wasNew = this.isNew

  // stop all others medias if this one starts playing
  if (this.isModified('started') && this.started && !this.ended) {
    this.constructor
      .find({ ended : null })
      .where('_id').ne(this._id)
      .where('started').ne(null)
      .then(function(results) {
        results.forEach(function (media) {
          media.ended = Date.now()
          media.save()
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

mediaSchema.post('save', function(media) {
  if (this.wasNew) {
    logger.debug(`Added a new Media\n${media.toString()}`)
    websockets.sockets.emit('medias.add', media)
  } else {
    logger.debug(`Updated Media\n${media.toString()}`)
  }
  websockets.sockets.emit('medias.' + media._id, media)
})

mediaSchema.virtual('thumbnail').get(function() {
  if (this.mimeType.includes('html')) {
    // https://stackoverflow.com/a/2068371
    if (this.uri.startsWith('https://youtube') || this.uri.startsWith('https://www.youtube')) {
      const [uri, queries] = this.uri.split('?')
      if (/v=([^&]*)/.test(queries)) {
        // https://www.youtube.com/watch?v=XXXXXXXXX
        return `https://img.youtube.com/vi/${queries.match(/v=([^&]*)/).pop()}/default.jpg`
      } else {
        // https://www.youtube.com/embed/XXXXXXXXX?autoplay=true
        return `https://img.youtube.com/vi/${uri.match(/([^/]*)\/*$/).pop()}/default.jpg`
      }
    }
    return null
  }
  return `${this.uri}?height=256`
})
mediaSchema.set('toObject', { virtuals: true })
mediaSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model('Media', mediaSchema)