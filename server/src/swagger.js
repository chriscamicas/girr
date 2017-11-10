var express = require('express')
var router = express.Router()
var swaggerJSDoc = require('swagger-jsdoc')
var path = require('path')

// check here for documentation https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md

// swagger definition
var swaggerDefinition = {
  info: {
    title: 'GeekInc Remote Regie API',
    version: '2.0.1',
    description: 'This is the GIRR (aka GeekInc Remote Regie) app API. You can find out more about GIRR at [https://github.com/chriscamicas/girr](https://github.com/chriscamicas/girr) or on [geekinc.fr](http://geekinc.fr).'
  },
  // host: 'localhost:' + port, // TO DO - define it dynamically
  basePath: '/api'
}

// options for the swagger docs
var options = {
  // import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // path to the API docs
  apis: [path.resolve('src/routes/*.js')]
}

// initialize swagger-jsdoc
var swaggerSpec = swaggerJSDoc(options)

// serve swagger
router.get('/swagger.json', function (req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

router.get('/', function (req, res) {
  res.sendFile(path.resolve('public/swagger/index.html'))
  router.use('/', express.static('public/swagger'))
})

module.exports = router

