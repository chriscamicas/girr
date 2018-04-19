"use strict";
const mongoose = require('mongoose')
const Episode = require('./episode')
const logger = require('../logger')
const path = require('path')
const fs = require('fs')
const websockets = require('../websockets')()

let programSchema = new mongoose.Schema({
    name: { type: String, required: true},
    thumbnail: { type: String },
    logo: { type: String },
    logoBW: { type: String }, // logo in black and white
    created: { type: Date, required: true },
    modified: { type: Date, required: true },
    episodes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Episode' }]
});

// when a Program is removed, delete all its Episodes
programSchema.post('remove', function(program) {
  logger.debug("Removed Program " + program._id)
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
    websockets.sockets.emit('programs.add', program)
  }
  websockets.sockets.emit('programs.' + program._id, program)
})

module.exports = mongoose.model('Program', programSchema)