<template>
  <div class="mdc-text-field mdc-text-field--fullwidth" v-show="scenes.length > 0">
    <select class="mdc-select" v-on:change="changeScene($event)" id="activeScene">
      <option v-for="scene in scenes" :key="scene._id" :value="scene._id" :selected="scene.active">{{ scene.name }}</option>
    </select>
    <label for="activeScene" class="mdc-text-field__label mdc-text-field__label--float-above">Scene</label>
  </div>
</template>

<script>
import Event from '../utils/EventBus.js'
// import { textField } from 'material-components-web'
import xjs from 'xjs-framework/dist/xjs-es2015' // be aware of https://github.com/xjsframework/xjs/issues/171

export default {
  name: 'scenes',
  props: ['scenes'],
  data () {
    return {
      xjs: false
    }
  },
  watch: {
    'scenes' (scenes) {
      xjs.Scene.getActiveScene().then(currentActiveScene => {
        const sceneToActive = scenes.find(scene => {
          return scene.active
        })
        if (sceneToActive && currentActiveScene._id !== sceneToActive._id) {
          xjs.Scene.setActiveScene(sceneToActive.index)
        }
      })
    }
  },
  created () {
    xjs
      .ready()
      .then(xjs.Scene.getSceneCount)
      .then(count => {
        this.xjs = true
        // inspired by https://stackoverflow.com/a/29906506
        function processArray (array, fn) {
          let results = []
          return array.reduce(function (p, item) {
            return p.then(function () {
              return fn(item).then(function (data) {
                results.push(data)
                return results
              })
            })
          }, Promise.resolve())
        }
        let indexesArray = Array.from({length: count}, (v, k) => k + 1)
        processArray(indexesArray, this.getScene).then((scenes) => {
          xjs.Scene.getActiveScene().then(activeScene => {
            scenes.forEach((scene) => {
              scene.active = (scene._id === activeScene._id)
            })
            this.scenes = scenes
            this.updateXsplit({ scenes: this.scenes })
          })
        })
      })
  },
  methods: {
    getScene: function (index) {
      return new Promise(function (resolve, reject) {
        resolve(xjs.Scene.getById(index).then(scene => {
          scene.index = index
          return scene.getName().then(name => {
            scene.name = name
            return scene.getItems().then(items => {
              scene.items = items
              return scene
            })
          })
        }))
      })
    },
    updateXsplit: function (data) {
      Event.$emit('progressbar.toggle', true)
      this.$http.put('/api/xsplit/', data).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    changeScene: function (event) {
      this.scenes.forEach((scene) => {
        scene.active = (Number(event.target.value) === scene._id)
      })
      this.updateXsplit({ scenes: this.scenes })
    }
  },
  beforeDestroy () {
    if (this.xjs) {
      this.updateXsplit({ scenes: [] })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mdc-select {
  margin-top: 24px;
  width: 100%;
  max-width: 100%;
}
</style>
