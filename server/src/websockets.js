const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')
const logger = require('./logger')
const CircularJSON = require('circular-json')

/** 
 * Class representing a WebSockets Server
 */
function WebSockets() {
  if (!this.instance) {
    logger.info('Initiating the Websockets Server...')
    this.instance = io(server)

    // to log every messages being transmitted => https://stackoverflow.com/a/9042249
    var originalEmit = this.instance.sockets.emit
    this.instance.sockets.emit = function () {
      var event = arguments[0]
      var data  = arguments[1]
      if (!event.includes('connect')) { // osef des connect et disconnect
        logger.debug('[WS] ' + event + ' : ' + CircularJSON.stringify(data))
      }
      originalEmit.apply(this, Array.prototype.slice.call(arguments));
    }

    // log connect and disconnect
    this.instance.on('connection', function(socket) {
      logger.info('[WS] New connection from ' + socket.request.connection.remoteAddress)
      this.instance.emit('users.count', Object.keys(this.instance.sockets.connected).length)
      socket.on('disconnect', function(reason) {
        logger.info('[WS] ' + socket.request.connection.remoteAddress + ' just disconnected')
        this.instance.emit('users.count', Object.keys(this.instance.sockets.connected).length)
      }.bind(this))
    }.bind(this))
  }
  return this.instance
}

module.exports = WebSockets;
