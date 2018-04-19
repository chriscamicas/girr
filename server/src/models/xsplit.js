const cache = require('memory-cache')
const websockets = require('../websockets')()

/**
 * Class representing the displayed data for XSplit
 */
class XSplit {
  constructor () {
    "use strict";
    let data = cache.get('xsplit')
    if (data !== null) {
      this.title = data.title
      this.picture = data.picture
      this.background = data.background
      this.logo = data.logo
      /**
       * actually, we should store the program, episode, topic and media currently playing :
       * that way, the client knows what to display (Media > Topic > Episode)
       * and the server doesn't need to tell the client what title or picture
       */
      // this.program = data.program
      // this.episode = data.episode
      // this.topic = data.topic
      // this.media = data.media
      this.created = data.created
      this.modified = data.modified
    } else { // default values
      this.title = null
      this.picture = null
      this.background = null
      this.logo = null
      // this.program = null // or {}
      // this.episode = null // or {}
      // this.topic = null // or {}
      // this.media = null // or {}
      this.created = Date.now()
      this.modified = Date.now()
    }
  }

  save() {
    cache.put('xsplit', this)
    websockets.sockets.emit('xsplit', this)
  }
}

module.exports = XSplit;
