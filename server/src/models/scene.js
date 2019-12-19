const cache = require('memory-cache')
const websockets = require('../websockets')()

/**
 * Class representing the displayed data for Scene
 */
class Scene {
  
  /**
   * @swagger
   * definitions:
   *   Xsplit:
   *     properties:
   *       title:
   *         type: string
   *         description: displayed title on the scene scene
   *       picture:
   *         type: string
   *         description: picture uri
   *       background:
   *         type: string
   *         description: background image uri
   *       logo:
   *         type: string
   *         description: logo image uri, displayed at the top-right corner
   *       primarycolor:
   *         type: string
   *         description: primarycolor for title
   *       episode:
   *         $ref: '#/definitions/Episode'
   *       topic:
   *         $ref: '#/definitions/Topic'
   *       media:
   *         $ref: '#/definitions/Media'
   *       scenes:
   *         type: array
   *         description: Scene scenes
   *         items:
   *           type: object
   *           properties:
   *             _id:
   *               type: integer
   *               description: Xsplit internal scene id
   *             name:
   *               type: string
   *               description: scene given name in Xsplit
   *             active:
   *               type: boolean
   *               description: whether the scene is currently active or not
   */
  constructor() {
    "use strict";
    let data = cache.get("scene");
    if (data !== null) {
      this.title = data.title;
      this.picture = data.picture;
      this.background = data.background;
      this.fullscreen = data.fullscreen;
      this.logo = data.logo;
      this.primarycolor = data.primarycolor;
      /**
       * actually, we should store the program, episode, topic and media currently playing :
       * that way, the client knows what to display (Media > Topic > Episode)
       * and the server doesn't need to tell the client what title or picture
       */
      this.episode = data.episode;
      this.topic = data.topic;
      this.media = data.media;
      this.created = data.created;
      this.modified = data.modified;
      this.scenes = data.scenes;
    } else {
      // default values
      this.title = null;
      this.picture = null;
      this.background = null;
      this.fullscreen = false;
      this.logo = null;
      this.primarycolor = "#790102";
      this.episode = null; // or {} or search for playing episode in the database
      this.topic = null; // same
      this.media = null; // same
      this.scenes = [];
      this.created = Date.now();
      this.modified = Date.now();
    }
  }

  save() {
    cache.put("scene", this);
    websockets.sockets.emit("scene", this);
  }
}

module.exports = Scene;
