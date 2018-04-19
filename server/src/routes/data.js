const express = require('express')
const router = express.Router()
const logger = require('../logger')
const path = require('path')
const mime = require('mime')
const Jimp = require('jimp')

const jimpOptions = [ // https://github.com/oliver-moran/jimp#basic-methods
  'height', // int
  'width', // int
  'quality', // int
  'contrast', // float from -1 to +1
  'greyscale',
  'invert'
]

/**
 * @swagger
 * /data/{path}:
 *   get:
 *     tags:
 *       - File
 *     description: Return a single file
 *     summary: Get a file
 *     produces: application/json
 *     parameters:
 *       - name: path
 *         description: Path of the file
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: A single file
 *         type: file
 */
router.get('/:path*', function (req, res, next) {
  const filepath = process.env.DATA_PATH.startsWith('/') ? path.join(process.env.DATA_PATH, req.path) : path.join(__base, process.env.DATA_PATH, req.path)
  if (mime.getType(filepath).indexOf('image/') >= 0 && mime.getType(filepath).indexOf('gif') < 0 && Object.keys(req.query).some(queryName => jimpOptions.includes(queryName))) {
    Jimp
      .read(filepath)
      .then((image) => {
        Object.keys(req.query).forEach((queryName) => {
          switch (queryName) {
            case 'height':
              if (req.query[queryName]) image.resize(req.query.width ? parseInt(req.query.width) : Jimp.AUTO, parseInt(req.query[queryName]))
              break
            case 'width':
              if (req.query[queryName]) image.resize(parseInt(req.query[queryName]), req.query.height ? parseInt(req.query.height) : Jimp.AUTO)
              break
            case 'quality':
              image[queryName](parseInt(req.query[queryName]))
              break
            case 'contrast':
              if (req.query[queryName]) image.contrast(parseFloat(req.query[queryName]))
              break
            case 'invert':
            case 'greyscale':
              image[queryName]()
              break
          }
        })

        image
          .getBuffer(Jimp.AUTO, (err, buffer) => {
            res.type(image.getMIME())
            res.send(buffer)
          })
      })
  } else {
    res.sendFile(filepath)
  }
})

module.exports = router;