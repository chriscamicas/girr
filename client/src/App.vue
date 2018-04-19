<template>
  <div id="app">
    <router-view></router-view>
    <Snackbar></Snackbar>
  </div>
</template>

<script>
import Snackbar from './components/Snackbar'
import { autoInit } from 'material-components-web'

export default {
  name: 'app',
  components: { Snackbar },
  data () {
    return {
      title: 'GeekInc Remote Regie'
    }
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

<style>
#app {
  font-family: Roboto,sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

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
  margin-right: 24px;
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
