"use strict";
const mongoose = require('mongoose')
const Episode = require('./episode')
const logger = require('../logger')
const path = require('path')
const fs = require('fs')
const websockets = require('../websockets')()

/**
 * @swagger
 * definitions:
 *   Program:
 *     properties:
 *       name:
 *         type: string
 *         description: a name to identify the Program between others
 *         required: true
 *       thumbnail:
 *         type: string
 *         description: thumbnail uri
 *       logo:
 *         type: string
 *         description: logo uri
 *       logoBW:
 *         type: string
 *         description: black and white logo uri
 *       background:
 *         type: string
 *         description: background inscrust uri
 *       primarycolor:
 *         type: string
 *         description: couleur primaire pour le titrage
 */
let programSchema = new mongoose.Schema({
  name: { type: String },
  thumbnail: { type: String },
  logo: { type: String },
  logoBW: { type: String }, // logo in black and white
  background: { type: String },
  primarycolor: { type: String },
  created: { type: Date, required: true },
  modified: { type: Date, required: true },
  episodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Episode" }]
});

// when a Program is removed, delete all its Episodes
programSchema.post('remove', function(program) {
  logger.debug(`Removed Program ${program._id}`)
  websockets.sockets.emit('programs.delete', program)

  Episode
    .find({ program: program._id })
    .then(function(episodes) {
      episodes.forEach(function (episode) {
        episode.remove()
      })
    })
    .catch(function(error) {
        next(error)
    });

  if (program.thumbnail && fs.existsSync(path.join(__base, program.thumbnail))) {
    fs.unlinkSync(path.join(__base, program.thumbnail))
  }
})

programSchema.pre('save', function(next) {
  this.wasNew = this.isNew
  next()
})

programSchema.post('save', function(program) {
  if (this.wasNew) {
    logger.debug(`Added a new Program\n${program.toString()}`)
    websockets.sockets.emit('programs.add', program)
  } else {
    logger.debug(`Updated Program\n${program.toString()}`)
  }
  websockets.sockets.emit('programs.' + program._id, program)
})

module.exports = mongoose.model('Program', programSchema)