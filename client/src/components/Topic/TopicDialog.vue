<template>
  <aside id="topic-dialog"
    class="mdc-dialog"
    role="alertdialog"
    aria-labelledby="my-mdc-dialog-label"
    aria-describedby="my-mdc-dialog-description">
    <div class="mdc-dialog__surface">
      <header class="mdc-dialog__header">
        <h2 id="my-mdc-dialog-label" class="mdc-dialog__header__title">
          {{ title ? title : $t('topic.untitled') }}
        </h2>
      </header>
      <section id="my-mdc-dialog-description" class="mdc-dialog__body mdc-dialog__body--scrollable">
        <div class="mdc-text-field mdc-text-field--fullwidth" v-bind:class="{ 'mdc-text-field--upgraded' : topic.title }">
          <input type="text" id="title" class="mdc-text-field__input" v-model.lazy="topic.title" v-on:keyup.enter="confirm" >
          <label for="title" class="mdc-text-field__label" v-bind:class="{ 'mdc-text-field__label--float-above' : topic.title }">{{ $t('topic.title_label') }}</label>
        </div>
        <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--textarea">
          <textarea id="description" class="mdc-text-field__input" rows="8" :placeholder="$t('topic.description_label')" v-model.lazy="topic.description">{{ topic.description }}</textarea>
        </div>
        <div class="mdc-form-field">
          <div class="mdc-checkbox">
            <input type="checkbox" class="mdc-checkbox__native-control" v-model.lazy="topic.fullscreen" id="fullscreen"/>
            <div class="mdc-checkbox__background">
              <svg version="1.1" class="mdc-checkbox__checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" xml:space="preserve">
                <path class="mdc-checkbox__checkmark__path" fill="none" stroke="white" d="M1.73,12.91 8.1,19.28 22.79,4.59"/>
              </svg>
              <div class="mdc-checkbox__mixedmark"></div>
            </div>
          </div>
          <label for="fullscreen">Fullscreen</label>
        </div>
        <div class="mdc-grid-list">
          <ul class="mdc-grid-list__tiles">
            <li class="mdc-grid-tile" v-for="media in medias">
              <div class="mdc-grid-tile__primary">
                <img class="mdc-grid-tile__primary-content" :src="media._id && media.thumbnail ? media.thumbnail : media.uri" />
                <i class="material-icons" v-on:click="deleteMedia(media)">cancel</i>
              </div>
              <span class="mdc-grid-tile__secondary" v-if="media.label">
                <span class="mdc-grid-tile__title" :title="media.label">{{ media.label }}</span>
              </span>
            </li>
            <li class="mdc-grid-tile add-tile">
              <div class="mdc-grid-tile__primary">
                <input type="file" name="file" accept="image/*" class="input-file" v-on:change="fileChange($event);" style="display: none;">
                <img class="mdc-grid-tile__primary-content" v-on:click="$event.currentTarget.parentNode.querySelector('input').click()"/>
              </div>
              <span class="mdc-grid-tile__secondary">
                <span class="mdc-grid-tile__title mdc-text-field">
                  <input type="text" id="uri" class="mdc-text-field__input" v-on:change="uriChange($event)">
                  <label for="uri" class="mdc-text-field__label">URL</label>
                </span>
              </span>
            </li>
          </ul>
        </div>
      </section>
      <footer class="mdc-dialog__footer">
        <button type="button" class="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--delete" v-on:click="deleteTopic(topic)">
          <i class="material-icons mdc-button__icon">delete</i>
          <span>{{ $t('actions.delete') }}</span>
        </button>
        <button type="button" class="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--cancel" v-on:click="close">
          <i class="material-icons mdc-button__icon">clear</i>
          <span>{{ $t('actions.cancel') }}</span>
        </button>
        <button type="button" class="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--accept mdc-button--raised" v-on:click="confirm">
          <i class="material-icons mdc-button__icon">check</i>
          <span>{{ $t('actions.update') }}</span>
        </button>
      </footer>
    </div>
    <div class="mdc-dialog__backdrop"></div>
  </aside>
</template>

<script>
import Event from '../../utils/EventBus.js'
import { dialog, textField } from 'material-components-web'
import assign from 'object-assign'
import validUrl from 'valid-url'

export default {
  name: 'TopicDialog',
  data () {
    return {
      dialog: null,
      title: null,
      topic: {},
      medias: []
    }
  },
  mounted () {
    this.dialog = new dialog.MDCDialog(this.$el)
    textField.MDCTextField.attachTo(this.$el.querySelector('.mdc-text-field'))
    this.addTileTextfield = new textField.MDCTextField(this.$el.querySelector('.add-tile .mdc-text-field'))
    Event.$off('topicDialog.show').$on('topicDialog.show', this.show)
    Event.$off('topicDialog.close').$on('topicDialog.close', this.close)
    this.dialog.focusTrap_.activate = () => {
      this.$el.querySelector('input#title').select()
    }
  },
  methods: {
    show: function (topic, medias) {
      this.title = topic.title
      this.topic = assign({}, topic)
      this.medias = assign([], medias)
      this.$el.querySelector('textarea').value = this.topic.description ? this.topic.description : ''
      this.dialog.show()
    },
    close: function () {
      this.dialog.close()
    },
    confirm: function (event) {
      this.$el.querySelector('.mdc-dialog__footer__button--accept').disabled = true
      this
        .updateTopic(this.topic)
        .then((response) => {
          Event.$emit(`topics.${this.topic._id}.update`, this.topic, this.medias)
          this.close()
        })
        .finally(() => {
          this.$el.querySelector('.mdc-dialog__footer__button--accept').disabled = false
        })
    },
    fileChange: function (event) {
      const files = event.target.files
      if (files.length > 0) {
        let FR = new FileReader()
        FR.addEventListener('load', (e) => {
          const highestPosition = Math.max.apply(Math, this.medias.map(m => m.position))
          this.medias.push({
            uri: e.target.result,
            label: files[0].name,
            file: files[0],
            position: (isFinite(highestPosition) ? highestPosition : 0) + 1
          })
          event.target.value = null
        })
        FR.readAsDataURL(files[0])
      }
    },
    uriChange: function (event) {
      if (validUrl.isUri(event.target.value)) {
        const highestPosition = Math.max.apply(Math, this.medias.map(m => { return m.position }))
        this.medias.push({
          uri: event.target.value,
          position: (isFinite(highestPosition) ? highestPosition : 0) + 1
        })
        event.target.value = null
        this.addTileTextfield.valid = true
      } else {
        this.addTileTextfield.valid = false
      }
    },
    deleteMedia: function (media) {
      const index = this.medias.indexOf(this.medias.find(function (dialogMedia) {
        return dialogMedia === media
      }))
      if (index > -1) this.medias.splice(index, 1)
    },
    updateTopic: function (topic) {
      Event.$emit('progressbar.toggle', true)
      return this.$http.put(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${topic._id}`, topic)
        .then(response => Event.$emit('topic.updated', response.body))
        .catch(error => {
          Event.$emit('http.error', error)
          return Promise.reject(error)
        })
        .finally(() => Event.$emit('progressbar.toggle', false))
    },
    deleteTopic: function (topic) {
      Event.$emit('progressbar.toggle', true)
      this.$http.delete(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${topic._id}`)
      .then(() => {
        Event.$emit('topic.deleted', topic)
        this.close()
      })
      .catch(error => {
        Event.$emit('http.error', error)
        return Promise.reject(error)
      })
      .finally(() => Event.$emit('progressbar.toggle', false))
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mdc-text-field--textarea {
  margin-top: 16px;
}

.mdc-text-field--textarea textarea {
  padding-top: 16px;
}

.mdc-dialog__body--scrollable {
  max-height: calc(80vh - 56px - 52px); /* main - header - footer */
}

/* fix mdc-text-field--fullwidth padding */
.mdc-text-field--fullwidth:not(.mdc-text-field--textarea) .mdc-text-field__input {
  padding: 10px 0;
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
  cursor: pointer;
}

.mdc-grid-tile__primary i:hover {
  color: var(--mdc-theme-secondary);
}

.add-tile img {
  cursor: pointer;
  background: transparent;
  background-repeat: no-repeat;
  background-position: center center;
  background-image: url("\
  data:image/svg+xml;utf8, \
    <svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='170px' height='50px'> \
      <text x='85' y='28' \
        style='text-anchor: middle' font-size='16'> \
        Click here to upload \
      </text> \
    </svg>\
  ");
}

.add-tile .mdc-grid-tile__secondary {
  padding: 0 16px;
  height: inherit;
}

.add-tile .mdc-grid-tile__secondary .mdc-text-field:not(.mdc-text-field--invalid) label {
  color: white;
}

.add-tile .mdc-grid-tile__secondary .mdc-text-field:not(.mdc-text-field--invalid) input {
  border-color: white;
}

.add-tile .mdc-grid-tile__secondary .mdc-text-field input {
  color: white;
}

.mdc-button .mdc-button__icon {
  line-height: 32px;
  vertical-align: initial
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
  margin-right: auto;
}

/* .mdc-checkbox {
  display: flex;
  flex-direction: column;
} */
</style>
