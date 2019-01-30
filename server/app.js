"use strict" // https://stackoverflow.com/a/33001437
// set all config variables as env variables
const config = require('dotenv-extended').load({
  path: __dirname + '/config/.env',
  defaults: __dirname + '/config/.env.defaults',
  errorOnMissing: false,
  errorOnExtra: false,
  assignToProcessEnv: true,
  overrideProcessEnv: false
})

// to retrieve the absolute project path without doing some magic (ie. '../../..')
global.__base = __dirname + '/'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const io = require("./src/websockets")()
const mongoose = require('mongoose')
const basicAuth = require('express-basic-auth')
const logger = require("./src/logger")
const path = require('path')
const fs = require('fs')
const utils = require('./src/utils')

const password = process.env.GIRR_PASSWORD
if (password) {
  app.use(basicAuth({
    users: {
      girr: password
    },
    challenge: true,
    realm: 'g1RR'
  }));
}

process.env.DATA_PATH = process.env.DATA_PATH.startsWith('/') ? process.env.DATA_PATH : path.join(__base, process.env.DATA_PATH)
if (!fs.existsSync(process.env.DATA_PATH)) utils.mkdirSyncRecursive(process.env.DATA_PATH)

app
  .use(bodyParser.urlencoded({ limit: '50mb', extended: false })) // parse application/x-www-form-urlencoded
  .use(bodyParser.json({ limit: '50mb' })) // parse application/json
  .use(function (req, res, next) { // logging middleware to use for all requests
    logger.log('info',
      '[%s] >> %s %s %s',
      req.connection.remoteAddress,
      req.method,
      req.url,
      Object.keys(req.body).length ? JSON.stringify(req.body) : ''
    )
    next() // make sure we go to the next routes and don't stop here
  })
  .use(express.static('./dist'))
  .use('/data', require('./src/routes/data.js'))
  .use('/api', require('./src/routes'))

logger.info('Configuration :')
Object.keys(config).forEach(function (index) {
  logger.info(`\t${index} : ${process.env[index]}`)
})

mongoose.Promise = Promise;
mongoose.connect(process.env.MONGO_ENDPOINT, { useMongoClient: true })  .then(() => {
    io.listen(
      app.listen(process.env.PORT, () => {
        const interfaces = require('os').networkInterfaces()
        logger.info('Server listening at :')
        Object.keys(interfaces).forEach(function (element) {
          if (!element.includes('lo') && interfaces[element][0].family === 'IPv4') {
            logger.info(`\thttp://${interfaces[element][0].address}:${process.env.PORT}/`)
          }
        })
      })
    )
  })
  .catch((err) => {
    logger.error(err)
  })

module.exports = app