<template>
  <div>
    <Toolbar :title="'Administration'"></Toolbar>
    <main class="mdc-toolbar-fixed-adjust">
      <div class="mdc-textfield mdc-textfield--fullwidth mdc-textfield--with-trailing-icon" v-bind:class="{ 'mdc-textfield--upgraded' : xsplit.title }">
        <i class="material-icons mdc-textfield__icon" tabindex="0">label</i>
        <input type="text" id="title" class="mdc-textfield__input" :value="xsplit.title" v-model.lazy="xsplit.title" v-on:change="updateXsplit({title: $event.target.value})">
        <label for="title" class="mdc-textfield__label" v-bind:class="{ 'mdc-textfield__label--float-above' : xsplit.title }">Title</label>
      </div>
      <div class="mdc-textfield mdc-textfield--fullwidth mdc-textfield--with-trailing-icon" v-bind:class="{ 'mdc-textfield--upgraded' : xsplit.picture }">
        <i class="material-icons mdc-textfield__icon" tabindex="0">photo</i>
        <input type="text" id="picture" class="mdc-textfield__input" :value="xsplit.picture" v-model.lazy="xsplit.picture" v-on:change="updateXsplit({picture: $event.target.value})">
        <label for="picture" class="mdc-textfield__label" v-bind:class="{ 'mdc-textfield__label--float-above' : xsplit.picture }">Picture</label>
      </div>
      <div class="mdc-textfield mdc-textfield--fullwidth mdc-textfield--with-trailing-icon" v-bind:class="{ 'mdc-textfield--upgraded' : xsplit.logo }">
        <i class="material-icons mdc-textfield__icon flip-vertically" tabindex="0">photo_album</i>
        <input type="text" id="logo" class="mdc-textfield__input" :value="xsplit.logo" v-model.lazy="xsplit.logo" v-on:change="updateXsplit({logo: $event.target.value})">
        <label for="logo" class="mdc-textfield__label" v-bind:class="{ 'mdc-textfield__label--float-above' : xsplit.logo }">Logo</label>
      </div>
      <div class="mdc-textfield mdc-textfield--fullwidth mdc-textfield--with-trailing-icon" v-bind:class="{ 'mdc-textfield--upgraded' : xsplit.background }">
        <i class="material-icons mdc-textfield__icon" tabindex="0">photo_size_select_large</i>
        <input type="text" id="background" class="mdc-textfield__input" :value="xsplit.background" v-model.lazy="xsplit.background" v-on:change="updateXsplit({background: $event.target.value})">
        <label for="background" class="mdc-textfield__label" v-bind:class="{ 'mdc-textfield__label--float-above' : xsplit.background }">Background</label>
      </div>
      <iframe :src="xsplitPath"/>
    </main>
  </div>
</template>

<script>
import Event from '../utils/EventBus.js'
import Toolbar from './Toolbar'
import { textfield } from 'material-components-web'

export default {
  name: 'admin',
  components: {
    Toolbar
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
  created () {
    this.getXsplit()
    this.$options.sockets['xsplit'] = (data) => {
      this.xsplit = data
    }
  },
  mounted () {
    this.$el.querySelectorAll('.mdc-textfield').forEach(function (mdlTextfield) {
      textfield.MDCTextfield.attachTo(mdlTextfield)
    })
  },
  watch: {
    // call again the method if the route changes
    '$route': 'getXsplit'
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
          console.error(response)
          Event.$emit('snackbar.message', 'Error : ' + (response.statusText ? response.statusText : 'no connection'))
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
          console.error(response)
          Event.$emit('snackbar.message', 'Error : ' + (response.statusText ? response.statusText : 'no connection'))
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
  height: calc(100vh - 68px - 32px);
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-flow: column;
      flex-flow: column;
}

iframe {
  width: 100%;
  flex: 1 1 100%; /* fills remaining space */
}

/* fix mdc-textfield--fullwidth padding */
.mdc-textfield--fullwidth:not(.mdc-textfield--textarea) .mdc-textfield__input {
  padding: 10px 0;
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
