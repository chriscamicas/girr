const router = require('express').Router()
const logger = require('../logger')

/** 
 * API Routes
 */

// middleware to use for all requests in the API
router.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next() // make sure we go to the next routes and don't stop here
})
// swagger UI
.use('/', require('../swagger'))
// api routes
.use('/programs', require('./program.js'))
.use('/xsplit', require('./xsplit.js'))
// error handler (middleware)
.use(function (err, req, res, next) {
  var defaultError = {
    message: 'Something went wrong',
    status: 500,
    date: new Date().toString()
  }

  var error = Object.assign(defaultError, {message: err.message}, err)
  logger.error(err)
  res.status(error.status).send(error)
})

module.exports = router