<template>
  <div id="app" :class="{ bottombarActive : bottombarShown }">
    <router-view class="main-content"></router-view>
    <transition name="slide">
      <Bottombar v-show="bottombarShown" style="position: fixed; bottom: 0;"></Bottombar>
    </transition>
    <Snackbar></Snackbar>
  </div>
</template>

<script>
import Event from './utils/EventBus.js'
import Snackbar from './components/Snackbar'
import Bottombar from './components/Bottombar'
import { autoInit } from 'material-components-web'

export default {
  name: 'app',
  components: { Snackbar, Bottombar },
  data () {
    return {
      title: 'GeekInc Remote Regie',
      bottombar: false
    }
  },
  watch: {
    'episode.started' (value) {
      if (value !== null && this.episode.ended === null) {
        this.timePlayedHandler = window.setInterval(() => {
          this.timePlayed = !this.episode.started ? 0 : (this.episode.ended ? new Date(this.episode.ended).getTime() : new Date().getTime()) - new Date(this.episode.started).getTime()
        }, 1000)
      }
      this.timePlayed = !this.episode.started ? 0 : (this.episode.ended ? new Date(this.episode.ended).getTime() : new Date().getTime()) - new Date(this.episode.started).getTime()
    },
    'episode.ended' (value) {
      if (value !== null && this.episode.started !== null) {
        window.clearInterval(this.timePlayedHandler)
      }
    }
  },
  computed: {
    bottombarShown () {
      return this.bottombar && this.$route.fullPath.indexOf('xsplit') < 0
    }
  },
  created () {
    Event.$on('bottombar.toggle', (boolean) => {
      this.bottombar = boolean
    })
    Event.$on('http.error', (response) => {
      let message = response.body.message ? response.body.message : `Error : ${response.statusText ? response.statusText : 'no connection'}`
      console.error(response)
      Event.$emit('snackbar.message', message)
    })
  },
  mounted: function () {
    autoInit() // autoInit MDC
  },
  sockets: {
    connect: function () {
      console.log('Websocket connection established')
    },
    disconnect: function () {
      console.warn('Disconnected from Websocket')
    }
  }
}
</script>

<style scoped>
#app {
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.main-content {
  background-color: white;
}

.main-content,
.main-content >>> .fab {
  -webkit-transition: margin-bottom 0.5s; /* Safari */
  transition: margin-bottom 0.5s;
}

#app.bottombarActive .main-content,
#app.bottombarActive .main-content >>> .fab {
  margin-bottom: 56px;
}

#app.bottombarActive .mdc-snackbar--active {
  bottom: 70px;
  z-index: 1;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.5s
}
.slide-enter, .slide-leave-to /* .fade-leave-active below version 2.1.8 */ {
  transform: translateY(100%);
}
</style>

<style>
body {
  margin: 0;
}

.unselectable {
  -moz-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style>

<!-- Material Design Components -->
<style>@import '../node_modules/material-components-web/dist/material-components-web.min.css'</style>

<!-- Google Material Icons -->
<style>@import '../node_modules/material-design-icons/iconfont/material-icons.css'</style>

<style>@import 'https://fonts.googleapis.com/css?family=Oswald'</style>

<!-- Styling MDC -->
<style>
:root {
  --mdc-theme-primary: #005976; /* customize MDC color */
  --mdc-theme-secondary: #ff4200;
}

.mdc-badge {
  position: relative;
  white-space: nowrap;
}

.mdc-badge[data-badge]::after {
  content: attr(data-badge);
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-direction: row;
  -ms-flex-direction: row;
  flex-direction: row;
  -webkit-flex-wrap: wrap;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-align-content: center;
  -ms-flex-line-pack: center;
  align-content: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  position: absolute;
  top: -11px;
  right: -24px;
  font-family: "Roboto","Helvetica","Arial",sans-serif;
  font-weight: 600;
  font-size: 12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--mdc-theme-secondary);
  color: #fff;
}

.mdc-badge.mdc-badge--overlap::after {
  right: -10px;
}
</style>
