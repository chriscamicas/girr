<template>
  <aside id="topic-dialog"
    class="mdc-dialog"
    role="alertdialog"
    aria-labelledby="my-mdc-dialog-label"
    aria-describedby="my-mdc-dialog-description">
    <div class="mdc-dialog__surface">
      <header class="mdc-dialog__header">
        <h2 id="my-mdc-dialog-label" class="mdc-dialog__header__title">
          {{ topic.title }}
        </h2>
      </header>
      <section id="my-mdc-dialog-description" class="mdc-dialog__body mdc-dialog__body--scrollable">
        <div class="mdc-textfield mdc-textfield--fullwidth" v-bind:class="{ 'mdc-textfield--upgraded' : topic.title }">
          <input type="text" id="title" class="mdc-textfield__input" :value="topic.title" v-model.lazy="topic.title">
          <label for="title" class="mdc-textfield__label" v-bind:class="{ 'mdc-textfield__label--float-above' : topic.title }">Title</label>
        </div>
        <div class="mdc-textfield mdc-textfield--fullwidth mdc-textfield--textarea">
          <textarea id="description" class="mdc-textfield__input" rows="8" placeholder="Description" v-model.lazy="topic.description">{{ topic.description }}</textarea>
        </div>
        <div class="mdc-grid-list">
          <ul class="mdc-grid-list__tiles">
            <li class="mdc-grid-tile" v-for="media in medias">
              <div class="mdc-grid-tile__primary">
                <img class="mdc-grid-tile__primary-content" :src="media._id && media.uri ? media.uri + '?height=256' : media.uri" />
                <i class="material-icons" v-on:click="deleteMedia(media)">cancel</i>
              </div>
              <span class="mdc-grid-tile__secondary" v-if="media.label">
                <span class="mdc-grid-tile__title">{{ media.label }}</span>
              </span>
            </li>
            <li class="mdc-grid-tile add-tile">
              <div class="mdc-grid-tile__primary">
                <input type="file" name="file" accept="image/*" class="input-file" v-on:change="fileChange($event.target.name, $event.target.files);" style="display: none;">
                <img class="mdc-grid-tile__primary-content" v-on:click="$event.currentTarget.parentNode.querySelector('input').click()"/>
              </div>
              <span class="mdc-grid-tile__secondary">
                <span class="mdc-grid-tile__title mdc-textfield">
                  <input type="text" id="uri" class="mdc-textfield__input" v-on:change="uriChange($event)">
                  <label for="uri" class="mdc-textfield__label">URL</label>
                </span>
              </span>
            </li>
          </ul>
        </div>
      </section>
      <footer class="mdc-dialog__footer">
        <div style="margin-right: auto;">
          <button type="button" class="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--delete" v-on:click="deleteTopic">
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
import { dialog, textfield } from 'material-components-web'
import assign from 'object-assign'
import validUrl from 'valid-url'

export default {
  name: 'TopicDialog',
  data () {
    return {
      dialog: null,
      topic: {},
      medias: []
    }
  },
  mounted () {
    this.dialog = new dialog.MDCDialog(this.$el)
    textfield.MDCTextfield.attachTo(this.$el.querySelector('.mdc-textfield'))
    this.addTileTextfield = new textfield.MDCTextfield(this.$el.querySelector('.add-tile .mdc-textfield'))
    Event.$on('topicDialog.show', this.show)
    Event.$on('topicDialog.close', this.close)
  },
  methods: {
    show: function (topic, medias) {
      this.topic = assign({}, topic)
      this.medias = assign([], medias)
      this.$el.querySelector('textarea').value = this.topic.description ? this.topic.description : ''
      this.dialog.show()
    },
    close: function () {
      this.dialog.close()
    },
    confirm: function () {
      Event.$emit('topic.update', this.topic, this.medias)
      this.close()
    },
    deleteTopic: function () {
      Event.$emit('topic.delete', this.topic)
      this.close()
    },
    fileChange: function (name, files) {
      if (files.length > 0) {
        let FR = new FileReader()
        FR.addEventListener('load', (e) => {
          this.medias.push({uri: e.target.result, label: files[0].name, file: files[0]})
        })
        FR.readAsDataURL(files[0])
      }
    },
    uriChange: function (event) {
      if (validUrl.isUri(event.target.value)) {
        this.medias.push({uri: event.target.value})
        event.target.value = ''
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
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mdc-textfield--textarea {
  margin-top: 16px;
}

.mdc-dialog__body--scrollable {
  max-height: calc(80vh - 56px - 52px); /* main - header - footer */
}

/* fix mdc-textfield--fullwidth padding */
.mdc-textfield--fullwidth:not(.mdc-textfield--textarea) .mdc-textfield__input {
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

.add-tile .mdc-grid-tile__secondary .mdc-textfield:not(.mdc-textfield--invalid) label {
  color: white;
}

.add-tile .mdc-grid-tile__secondary .mdc-textfield:not(.mdc-textfield--invalid) input {
  border-color: white;
}

.add-tile .mdc-grid-tile__secondary .mdc-textfield input {
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
}
</style>
