<template>
  <div class="topic" v-bind:class="{ playing : topic.started !== null && topic.ended === null }">
    <li role="separator" class="mdc-list-divider"></li>
    <li class="mdc-list-item" data-mdc-auto-init="MDCRipple" v-on:click="toggle(!topic.expanded)">
      <img v-if="thumbnail" class="mdc-list-item__graphic unselectable" :src="thumbnail" width="56" height="56" :alt="medias[0].label">
      <span v-else class="mdc-list-item__graphic" role="presentation">
        <i class="material-icons" aria-hidden="true">comment</i>
      </span>
      <span class="mdc-list-item__text">
        {{ topic.title ? topic.title : $t('topic.untitled') }}
        <span class="mdc-list-item__secondary-text" v-bind:class="{ limited : timePlayed >= 900000 }" v-if="topic.started">{{ timePlayed | formatTime }}</span>
      </span>
      <span class="mdc-list-item__meta">
        <i class="mdc-icon-toggle material-icons edit-button" :arial-label="$t('actions.edit')" v-on:click="editTopic">edit</i>
        <i v-if="topic.started !== null && topic.ended === null" class="mdc-icon-toggle material-icons stop-button" :arial-label="$t('actions.stop')" v-on:click="stopTopic">stop</i>
        <i v-else class="mdc-icon-toggle material-icons play-button" :arial-label="$t('actions.play')" v-on:click="startTopic">play_arrow</i>
        <i class="material-icons chevron unselectable" :arial-label="$t('actions.expand')">keyboard_arrow_down</i>
      </span>
    </li>
    <div class="content">
      <pre v-if="topic.description">{{ topic.description }}</pre>
      <div class="mdc-grid-list">
        <draggable
          v-if="medias.length > 0"
          element="ul"
          v-model="medias"
          :options="dragOptions"
          @change="itemMoved"
          class="mdc-grid-list__tiles">
          <MediaTile v-for="media in medias" :key="media._id" :media="media" :topicId="topic._id"></MediaTile>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script>
import Event from '../../utils/EventBus.js'
import { autoInit } from 'material-components-web'
import MediaTile from '../Media/MediaTile'
import draggable from 'vuedraggable'

export default {
  props: ['topic'],
  data () {
    return {
      timePlayed: !this.topic.started ? 0 : (this.topic.ended ? new Date(this.topic.ended).getTime() : new Date().getTime()) - new Date(this.topic.started).getTime(),
      medias: []
    }
  },
  components: {
    MediaTile,
    draggable
  },
  computed: {
    thumbnail () {
      return this.medias.length > 0 ? this.medias[0].thumbnail : null
    },
    dragOptions () {
      return {
        animation: 0,
        handle: 'img',
        delay: 100
      }
    }
  },
  created () {
    // this.topic.expanded = false
    this.$options.sockets[`topics.${this.topic._id}.delete`] = function (data) {
      Event.$emit('topic.deleted', data)
    }
    this.$options.sockets[`topics.${this.topic._id}`] = function (data) {
      Event.$emit('topic.updated', data)
    }
    this.$options.sockets['medias.add'] = (media) => {
      if (media.topic === this.topic._id) {
        Event.$emit(`topics.${this.topic._id}.media.added`, media)
      }
    }
    if (this.topic.started !== null && this.topic.ended === null) {
      this.timePlayedHandler = window.setInterval(() => {
        this.timePlayed = !this.topic.started ? 0 : (this.topic.ended ? new Date(this.topic.ended).getTime() : new Date().getTime()) - new Date(this.topic.started).getTime()
      }, 1000)
    }
    Event.$off(`topics.${this.topic._id}.update`).$on(`topics.${this.topic._id}.update`, (dialogTopic, dialogMedias) => {
      // parcours des Topic's medias pour savoir lesquels sont à supprimer
      topicMediasLoop:
      for (let i = 0; i < this.medias.length; i++) {
        for (let j = 0; j < dialogMedias.length; j++) {
          if (this.medias[i]._id === dialogMedias[j]._id) {
            continue topicMediasLoop
          }
        }
        this.deleteMedia(this.medias[i])
      }

      // parcours des Dialog's medias pour savoir lesquels sont à ajouter
      dialogMedias.forEach((dialogMedia) => {
        if (!dialogMedia._id && (dialogMedia.file || dialogMedia.uri)) {
          this.addMedia(dialogMedia)
        }
      })
    })
    Event.$off(`topics.${this.topic._id}.delete`).$on(`topics.${this.topic._id}.delete`, (dialogTopic) => {
      this.deleteTopic(dialogTopic)
    })
    Event.$off(`topics.${this.topic._id}.media.added`).$on(`topics.${this.topic._id}.media.added`, (media) => {
      const index = this.medias.indexOf(this.medias.find(function (topicMedia) {
        return topicMedia._id === media._id
      }))
      if (index < 0) this.medias.push(media)
    })
    Event.$off(`topics.${this.topic._id}.media.updated`).$on(`topics.${this.topic._id}.media.updated`, (media) => {
      for (let i = 0; i < this.medias.length; i++) {
        if (this.medias[i]._id === media._id) {
          this.medias[i] = media
          this.medias.sort(function (m1, m2) { return m1.position - m2.position })
          this.$forceUpdate()
          break
        }
      }
    })
    Event.$off(`topics.${this.topic._id}.media.deleted`).$on(`topics.${this.topic._id}.media.deleted`, (media) => {
      const index = this.medias.indexOf(this.medias.find(function (topicMedia) {
        return topicMedia._id === media._id
      }))
      if (index > -1) this.medias.splice(index, 1)
    })
    this.fetchMedias()
  },
  watch: {
    'topic.started' (value) {
      if (value !== null && this.topic.ended === null) {
        this.timePlayedHandler = window.setInterval(() => {
          this.timePlayed = !this.topic.started ? 0 : (this.topic.ended ? new Date(this.topic.ended).getTime() : new Date().getTime()) - new Date(this.topic.started).getTime()
        }, 1000)
        this.timePlayed = !this.topic.started ? 0 : (this.topic.ended ? new Date(this.topic.ended).getTime() : new Date().getTime()) - new Date(this.topic.started).getTime()
      }
    },
    'topic.ended' (value) {
      if (value !== null && this.topic.started !== null) {
        window.clearInterval(this.timePlayedHandler)
      }
    }
  },
  mounted () {
    // code here executes once the component is rendered
    autoInit(this.$el) // reapply MDCRipple to all mdc-list-item
  },
  methods: {
    toggle: function (bool) {
      this.topic.expanded = bool
      this.$forceUpdate()
      Event.$emit('topic.toggle', this.topic)
    },
    editTopic: function (event) {
      event.stopImmediatePropagation()
      Event.$emit('topicDialog.show', this.topic, this.medias)
    },
    startTopic: function () {
      event.stopImmediatePropagation()
      this.timePlayed = 0
      this.toggle(true)
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${this.topic._id}/start`).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('topic.updated', response.body)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    stopTopic: function () {
      event.stopImmediatePropagation()
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${this.topic._id}/stop`).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('topic.updated', response.body)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    fetchMedias: function () {
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${this.topic._id}/medias`).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          this.medias = response.body
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    addMedia: function (media) {
      let formData = new FormData()
      for (var propertyName in media) {
        formData.append(propertyName, media[propertyName])
      }
      Event.$emit('progressbar.toggle', true)
      this.$http.post(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${this.topic._id}/medias/`, formData).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          Event.$emit(`topic.${this.topic._id}.media.added`, response.body)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    deleteMedia: function (media) {
      Event.$emit('progressbar.toggle', true)
      this.$http.delete(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${this.topic._id}/medias/${media._id}`).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          Event.$emit(`topic.${this.topic._id}.media.deleted`, media)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    moveMedia: function (media, newPosition) {
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${this.topic._id}/medias/${media._id}/move`,
        {
          params: {
            position: newPosition
          }
        }
      ).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    itemMoved: function (event) {
      if (event.moved.element) {
        this.moveMedia(event.moved.element, event.moved.newIndex)
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.topic .mdc-list-item {
  cursor: pointer;
}

.topic .content {
  max-height: 0px;
  overflow: hidden;
  padding: 0 16px;
  transition: all 0.2s, max-height 0.2s; /* close rapidly */
}

.topic.expanded .content {
  transition: all 0.2s, max-height 1s; /* open slowly */
  max-height: 2048px;
  overflow: auto;
}

.topic.expanded .content pre {
  font-family: inherit;
  white-space: -moz-pre-wrap;
  white-space: -o-pre-wrap;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.topic .chevron {
  padding: 12px;
  transition: transform 0.2s;
}

.topic.expanded .chevron {
  transform: rotate(-180deg);
}

.topic time {
  margin: auto;
}

.topic .mdc-list-item__graphic {
  cursor: move; /* fallback: */
  cursor: -webkit-grab; /* Chrome 1-21, Safari 4+ */
  cursor:    -moz-grab; /* Firefox 1.5-26 */
  cursor:         grab; /* W3C standards syntax, should come least */
}

.topic img.mdc-list-item__graphic {
  object-fit: cover;
}

.topic.playing .mdc-list-item__text,
.topic.playing .mdc-list-item__meta,
.topic.playing .mdc-list-item__meta i {
  color: var(--mdc-theme-secondary,#ff4081);
}

.topic.playing .mdc-list-item__graphic {
  background-color: var(--mdc-theme-secondary,#ff4081);
}

.topic .mdc-list-divider {
  display: none;
}

.topic.expanded .mdc-list-divider {
  display: inherit;
}

.topic.expanded + .topic .mdc-list-divider {
  display: inherit;
}

.topic:not(.expanded):not(:hover) .edit-button,
.topic:not(.expanded):not(:hover) .play-button,
.topic:not(.expanded):not(:hover) .stop-button {
  display: none;
}

.mdc-list-item .mdc-list-item__text {
  margin-right: 16px;
  /* https://css-tricks.com/flexbox-truncated-text/ */
  overflow:hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mdc-list-item .mdc-list-item__secondary-text {
  min-width: 0;
}

.limited{
    color: var(--mdc-theme-primary,#ff4081);
    font-weight: bold;
}

.mdc-list-item .mdc-list-item__meta {
  width: auto;
  height: auto;
  display: inline-flex;
  flex-direction: row;
  align-items: flex-end;
}

.mdc-list-item .mdc-list-item__graphic {
  flex: none;
  color: white;
  background-color: rgba(0, 0, 0, .26);
}

.topic .mdc-icon-toggle::before,
.topic .mdc-icon-toggle::after {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

a.mdc-list-item {
  color: inherit;
  text-decoration: none;
}
</style>
