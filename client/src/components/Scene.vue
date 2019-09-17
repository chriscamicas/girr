<template>
  <main class="scene" :style="{ 'background-image': background }">
    <div v-if="!scene.fullscreen" class="title">{{ animatedTitle }}</div>
    <div :class="{fullscreen: scene.fullscreen}" class="content">
      <img v-if="!iframeContent" :src="scene.picture" :class="{ loading: scene.picture }" v-on:load="loaded($event)" v-on:error="failed($event)">
      <iframe v-else :src="iframeContent" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
   	</div>
    <img class="logo" v-if="logo" :src="logo">
  </main>
</template>

<script>
import Event from '../utils/EventBus.js'
import TWEEN from 'tween.js/src/Tween'

export default {
  name: 'scene',
  data () {
    return {
      scene: {},
      animatedTitle: ''
    }
  },
  created () {
    this.fetchData()
    this.$options.sockets['scene'] = (data) => {
      this.scene = data
    }
    document.title = 'Remote Regie'
  },
  computed: {
    iframeContent () {
      return this.scene.media && this.scene.media.mimeType.includes('html') ? this.scene.media.uri : null
    },
    background () {
      if (this.scene.fullscreen) {
        return null
      }
      if (this.scene.picture) {
        return 'url(' + (this.scene.background ? this.scene.background : require('../assets/img-background.jpg')) + ')'
      }
      return null
    },
    logo () {
      return this.scene.logo ? this.scene.logo + '?height=72' : null
    }
  },
  watch: {
    'scene' (newValue, oldValue) {
      console.log(newValue)
    },
    'scene.title' (newValue, oldValue) {
      function animate () {
        if (TWEEN.update()) {
          requestAnimationFrame(animate)
        }
      }

      let vm = this
      if (oldValue) {
        new TWEEN.Tween({numberOfCharsToDisplay: oldValue.length})
          .easing(TWEEN.Easing.Quadratic.Out)
          .to({ numberOfCharsToDisplay: 0 }, 500)
          .onUpdate(function () {
            vm.animatedTitle = oldValue.substr(0, this.numberOfCharsToDisplay)
          })
          .onComplete(function () {
            if (newValue) {
              new TWEEN.Tween({numberOfCharsToDisplay: 0})
                .easing(TWEEN.Easing.Quadratic.Out)
                .to({ numberOfCharsToDisplay: newValue.length }, 500)
                .onUpdate(function () {
                  vm.animatedTitle = newValue.substr(0, this.numberOfCharsToDisplay)
                })
                .start()
            }
          })
          .start()
      } else {
        if (newValue) {
          new TWEEN.Tween({numberOfCharsToDisplay: 0})
            .easing(TWEEN.Easing.Quadratic.Out)
            .to({ numberOfCharsToDisplay: newValue.length }, 500)
            .onUpdate(function () {
              vm.animatedTitle = newValue.substr(0, this.numberOfCharsToDisplay)
            })
            .start()
        }
      }
      animate()
    }
  },
  methods: {
    fetchData: function () {
      this.$http.get('/api/scene/').then(
        (response) => {
          this.scene = response.body
        },
        function (response) {
          Event.$emit('http.error', response)
        }
      )
    },
    loaded: function (event) {
      event.target.classList.remove('loading')
      // event.target.classList.remove('failed')
    },
    failed: function (event) {
      event.target.classList.remove('loading')
      if (this.scene.picture) {
        event.target.src = require('../assets/error.gif')
        // event.target.classList.add('failed')
        // Event.$emit('snackbar.message', `Unable to load ${event.target.src}`)
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main-content {
  background-color: transparent;
}

.scene {
	display: flex;
	flex-flow: column-reverse;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  width: 100vw;
  height: 100vh;
}

.scene .title {
  align-self: flex-start; /* sized to content */
  flex: 1 0 auto; /* grow to content */
  margin: 0.5em 30px;
  padding: 0 30px;
  font-family:'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 40px;
  color: black;
  background-color: white;
  text-transform: uppercase;
  text-overflow: ellipsis; /* ou au pire clip */
  box-sizing: border-box;
  box-shadow: 0px 0px 5px 0px rgba(0,0,0,0.75);
  line-height: 80px;
  border-radius: 40px;
  position: relative;
}

.scene .title::after {
  content: '';
  position: absolute;
  top: -30%;
  left: -30%;
  width: 100%;
  height: 80%;
  border-radius: 0 30px 30px 0;
  background-color: var(--mdc-theme-primary);
  z-index: -1;
}

@media (min-width: 481px) and (max-width: 840px) {
  .scene .title {
    max-width: calc(100% - 1em);
  }
}

@media (max-width: 480px) {
  .scene .title {
    margin: 0;
    max-width: calc(100%);
  }
}

.scene .logo {
  position: absolute;
  top: 0;
  right: 0;
  max-height: 72px;
  max-width: 72px;
  margin: 12px;
}

.fullscreen {
  margin-top: 0 !important;
}
.scene .content {
	flex: 1 1 100%; /* fills remaining space */
	display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 1.5em;
}

.scene .content img {
  width: 100%;
	max-width: 100%;
  max-height: 100%;
	object-fit: contain;
}

.scene .content iframe {
  width: 100%;
  height: 100%;
}

.loading {
  background: transparent;
  background-repeat: no-repeat;
  background-position: center center;
  /* inspired by http://david.ingledow.co.uk/blog/google-material-designs-animated-loading-spinner-svg-and-css/ and https://stackoverflow.com/a/41935729 */
  background-image: url("\
  data:image/svg+xml;utf8, \
    <svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='100px' height='100px' \
      style='-webkit-transform-origin: center center; \
            transform-origin: center center; \
            -webkit-animation: rotate 2s linear infinite; \
            animation: rotate 2s linear infinite; \
            position: absolute; \
            top: 0; \
            bottom: 0; \
            left: 0; \
            right: 0; \
            margin: auto;'> \
      <style type='text/css'> \
        .path { \
          stroke-dasharray: 1,200; \
          stroke-dashoffset: 0; \
          animation: dash 1.5s ease-in-out infinite, color 6s ease-in-out infinite; \
          stroke-linecap: round; \
        } \
        @keyframes rotate { 100% { transform: rotate(360deg); } } \
        @keyframes dash { \
          0% { stroke-dasharray: 1,200; stroke-dashoffset: 0; } \
          50% { stroke-dasharray: 89,200; stroke-dashoffset: -35; } \
          100% { stroke-dasharray: 89,200; stroke-dashoffset: -124; } \
        } \
        %40keyframes color { \
          100%, 0% { stroke: #d62d20; } \
          40% { stroke: #0057e7; } \
          66% { stroke: #008744; } \
          80%, 90% { stroke: #ffa700; } \
        } \
      %3C/style%3E \
      <circle cx='50' cy='50' r='20' fill='none' stroke-width='2' stroke-miterlimit='10' class='path'/> \
    </svg>\
  ");
}

.failed {
  height: 100%;
  background: transparent;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: contain;
  background-image: url('../assets/error.gif');
}
</style>
