<template>
  <div>
    <Toolbar :title="'Settings'"></Toolbar>
    <main class="mdc-toolbar-fixed-adjust">
      <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--with-trailing-icon" v-bind:class="{ 'mdc-text-field--upgraded' : xsplit.title }">
        <i class="material-icons mdc-text-field__icon" tabindex="0">label</i>
        <input type="text" id="title" class="mdc-text-field__input" :value="xsplit.title" v-model.lazy="xsplit.title" v-on:change="updateXsplit({title: $event.target.value})">
        <label for="title" class="mdc-text-field__label" v-bind:class="{ 'mdc-text-field__label--float-above' : xsplit.title }">Title</label>
      </div>
      <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--with-trailing-icon" v-bind:class="{ 'mdc-text-field--upgraded' : xsplit.picture }">
        <i class="material-icons mdc-text-field__icon" tabindex="0">photo</i>
        <input type="text" id="picture" class="mdc-text-field__input" :value="xsplit.picture" v-model.lazy="xsplit.picture" v-on:change="updateXsplit({picture: $event.target.value})">
        <label for="picture" class="mdc-text-field__label" v-bind:class="{ 'mdc-text-field__label--float-above' : xsplit.picture }">Picture</label>
      </div>
      <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--with-trailing-icon" v-bind:class="{ 'mdc-text-field--upgraded' : xsplit.logo }">
        <i class="material-icons mdc-text-field__icon flip-vertically" tabindex="0">photo_album</i>
        <input type="text" id="logo" class="mdc-text-field__input" :value="xsplit.logo" v-model.lazy="xsplit.logo" v-on:change="updateXsplit({logo: $event.target.value})">
        <label for="logo" class="mdc-text-field__label" v-bind:class="{ 'mdc-text-field__label--float-above' : xsplit.logo }">Logo</label>
      </div>
      <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--with-trailing-icon" v-bind:class="{ 'mdc-text-field--upgraded' : xsplit.background }">
        <i class="material-icons mdc-text-field__icon" tabindex="0">photo_size_select_large</i>
        <input type="text" id="background" class="mdc-text-field__input" :value="xsplit.background" v-model.lazy="xsplit.background" v-on:change="updateXsplit({background: $event.target.value})">
        <label for="background" class="mdc-text-field__label" v-bind:class="{ 'mdc-text-field__label--float-above' : xsplit.background }">Background</label>
      </div>
      <scenes :scenes="xsplit.scenes" v-if="xsplit.scenes"></scenes>
    </main>
  </div>
</template>

<script>
import Event from '../utils/EventBus.js'
import Toolbar from './Toolbar'
import scenes from './XsplitScenes'
import { textField } from 'material-components-web'

export default {
  name: 'settings',
  components: {
    Toolbar,
    scenes
  },
  data () {
    return {
      xsplit: {}
    }
  },
  computed: {
    xsplitPath: function () {
      return this.$router.resolve({name: 'Xsplit'}).href
    }
  },
  watch: {// call again the method if the route changes
    '$route': 'getXsplit'
  },
  created () {
    this.getXsplit()
    this.$options.sockets['xsplit'] = (data) => {
      this.xsplit = data
    }
  },
  mounted () {
    this.$el.querySelectorAll('.mdc-text-field--with-trailing-icon').forEach(function (mdlTextfield) {
      textField.MDCTextField.attachTo(mdlTextfield)
    })
  },
  methods: {
    getXsplit: function () {
      Event.$emit('progressbar.toggle', true)
      this.$http.get('/api/xsplit/').then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          this.xsplit = response.body
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    updateXsplit: function (data) {
      Event.$emit('progressbar.toggle', true)
      this.$http.put('/api/xsplit/', data).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          this.xsplit = response.body
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
main {
  margin: 0 auto;
  padding: 16px;
  max-width: 1280px;
  max-height: calc(100vh - 68px - 32px);
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-flow: column;
      flex-flow: column;
}

iframe {
  width: 100%;
  min-height: 100px;
  flex: 1 1 100%; /* fills remaining space */
}

/* fix mdc-text-field--fullwidth padding */
.mdc-text-field--fullwidth:not(.mdc-text-field--textarea) .mdc-text-field__input {
  padding-top: 10px;
}

.mdc-select {
  margin-top: 24px;
  width: 100%;
  max-width: 100%;
}

.flip-vertically {
  -moz-transform: scaleX(-1);
  -o-transform: scaleX(-1);
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
  filter: FlipH;
  -ms-filter: "FlipH";
}
</style>
