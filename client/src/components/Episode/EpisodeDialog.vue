<template>
  <aside id="episode-dialog"
    class="mdc-dialog"
    role="alertdialog"
    aria-labelledby="my-mdc-dialog-label"
    aria-describedby="my-mdc-dialog-description">
    <div class="mdc-dialog__surface">
      <header class="mdc-dialog__header">
        <h2 id="my-mdc-dialog-label" class="mdc-dialog__header__title">
          {{ episode.name }}
        </h2>
      </header>
      <section id="my-mdc-dialog-description" class="mdc-dialog__body mdc-dialog__body--scrollable">
        <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--with-trailing-icon" v-bind:class="{ 'mdc-text-field--upgraded' : episode.name }">
          <i class="material-icons mdc-text-field__icon" tabindex="0">label</i>
          <input type="text" id="name" class="mdc-text-field__input" :value="episode.name" v-model.lazy="episode.name">
          <label for="name" class="mdc-text-field__label" v-bind:class="{ 'mdc-text-field__label--float-above' : episode.name }">Name</label>
        </div>
        <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--with-trailing-icon" v-bind:class="{ 'mdc-text-field--upgraded' : episode.number }">
          <i class="material-icons mdc-text-field__icon" tabindex="0">format_list_numbered</i>
          <input type="text" id="number" class="mdc-text-field__input" :value="episode.number" v-model.lazy="episode.number" pattern="[0-9]+">
          <label for="number" class="mdc-text-field__label" v-bind:class="{ 'mdc-text-field__label--float-above' : episode.number }">Number</label>
        </div>
      </section>
      <footer class="mdc-dialog__footer">
        <div style="margin-right: auto;">
          <button type="button" class="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--delete" v-on:click="deleteEpisode">
            <i class="material-icons mdc-button__icon">delete</i>
            <span>Delete</span>
          </button>
        </div>
        <button type="button" class="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel" v-on:click="close"><i class="material-icons mdc-button__icon">clear</i><span>Cancel</span></button>
        <button type="button" class="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept mdc-button--raised" v-on:click="confirm"><i class="material-icons mdc-button__icon">check</i><span>Update</span></button>
      </footer>
    </div>
    <div class="mdc-dialog__backdrop"></div>
  </aside>
</template>

<script>
import Event from '../../utils/EventBus.js'
import { dialog, textField } from 'material-components-web'
import assign from 'object-assign'

export default {
  name: 'EpisodeDialog',
  data () {
    return {
      dialog: null,
      episode: {}
    }
  },
  mounted () {
    this.dialog = new dialog.MDCDialog(this.$el)
    textField.MDCTextField.attachTo(this.$el.querySelector('.mdc-text-field'))
    Event.$on('episodeDialog.show', this.show)
    Event.$on('episodeDialog.close', this.close)
  },
  methods: {
    show: function (episode) {
      if (this.episode._id !== episode._id) {
        this.episode = assign({}, episode)
      }
      this.dialog.show()
    },
    close: function () {
      this.dialog.close()
    },
    confirm: function () {
      Event.$emit('episode.update', this.episode)
      this.close()
    },
    deleteEpisode: function () {
      Event.$emit('episode.delete', this.episode)
      this.close()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mdc-text-field--textarea {
  margin-top: 16px;
}

.mdc-dialog__body--scrollable {
  max-height: calc(80vh - 56px - 52px); /* main - header - footer */
}

.mdc-grid-list {
  margin: 0 auto;
}

.mdc-grid-tile {
  --mdc-grid-list-tile-width: 192px;
  margin: 2px auto;
}

.mdc-grid-tile img {
  object-fit: contain;
}

.mdc-button__icon {
  vertical-align: text-bottom;
}

.mdc-grid-tile__primary i {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
}

/* fix mdc-text-field--fullwidth padding */
.mdc-text-field--fullwidth:not(.mdc-text-field--textarea) .mdc-text-field__input {
  padding: 10px 0;
}

.mdc-button .mdc-button__icon {
  line-height: 32px;
  vertical-align: initial;
}

@media screen and (max-width: 480px) {
  .mdc-button span {
    display: none;
  }
}
@media screen and (min-width: 481px) {
  .mdc-button .mdc-button__icon {
    display: none;
  }
}

.mdc-dialog__footer__button--delete {
  color: red;
}
</style>
