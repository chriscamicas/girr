<template>
  <li class="mdc-grid-tile" :class="{ playing : media.started && !media.ended }" v-on:click="toggleMedia(media)">
    <div class="mdc-grid-tile__primary">
      <img class="mdc-grid-tile__primary-content" :src="this.media.uri ? this.media.uri + '?height=256' : null" />
    </div>
    <span v-if="media.started && !media.ended" class="mdc-grid-tile__secondary">
      <span class="mdc-grid-tile__title">{{ timePlayed | formatTime }}</span>
    </span>
  </li>
</template>

<script>
import Event from '../../utils/EventBus.js'

export default {
  props: ['media', 'topicId'],
  data () {
    return {
      timePlayed: !this.media.started ? 0 : (this.media.ended ? new Date(this.media.ended).getTime() : new Date().getTime()) - new Date(this.media.started).getTime()
    }
  },
  created () {
    this.$options.sockets[`medias.${this.media._id}.delete`] = (data) => {
      Event.$emit(`topics.${this.topicId}.media.deleted`, data)
    }
    this.$options.sockets[`medias.${this.media._id}`] = (data) => {
      Event.$emit(`topics.${this.topicId}.media.updated`, data)
    }
    if (this.media.started !== null && this.media.ended === null) {
      this.timePlayedHandler = window.setInterval(() => {
        this.timePlayed = !this.media.started ? 0 : (this.media.ended ? new Date(this.media.ended).getTime() : new Date().getTime()) - new Date(this.media.started).getTime()
      }, 1000)
    }
  },
  watch: {
    'media.started' (value) {
      if (value !== null && this.media.ended === null) {
        this.timePlayedHandler = window.setInterval(() => {
          this.timePlayed = !this.media.started ? 0 : (this.media.ended ? new Date(this.media.ended).getTime() : new Date().getTime()) - new Date(this.media.started).getTime()
        }, 1000)
        this.timePlayed = !this.media.started ? 0 : (this.media.ended ? new Date(this.media.ended).getTime() : new Date().getTime()) - new Date(this.media.started).getTime()
      }
    },
    'media.ended' (value) {
      if (value !== null && this.media.started !== null) {
        window.clearInterval(this.timePlayedHandler)
      }
    }
  },
  methods: {
    startMedia: function (media) {
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${this.topicId}/medias/${media._id}/start`).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          Event.$emit(`topics.${this.topicId}.media.updated`, response.body)
          Event.$emit('snackbar.message', `Media ${response.body.label} started`)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    stopMedia: function (media) {
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${this.topicId}/medias/${media._id}/stop`).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          Event.$emit(`topics.${this.topicId}.media.updated`, response.body)
          Event.$emit('snackbar.message', `Media ${response.body.label} stopped`)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    toggleMedia: function (media) {
      if (media.started && !media.ended) {
        this.stopMedia(media)
      } else {
        this.startMedia(media)
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mdc-grid-tile {
  --mdc-grid-list-tile-width: 256px;
  margin: 2px auto;
}

@media screen and (max-width: 991px) {
  .mdc-grid-tile {
    --mdc-grid-list-tile-width: 192px;
  }
}
@media screen and (max-width: 767px) {
  .mdc-grid-tile {
    --mdc-grid-list-tile-width: 144px;
  }
}

img {
  object-fit: contain;
  cursor: pointer;
}

.mdc-grid-tile__icon {
  color: var(--mdc-theme-secondary,#ff4081);
  right: 0;
  margin-right: 12px;
  background-color: white;
  border-radius: 50%;
}

.mdc-grid-tile .mdc-grid-tile__secondary {
  text-align: right;
}

.mdc-grid-tile.playing .mdc-grid-tile__secondary {
  background-color: var(--mdc-theme-secondary,#ff4081);
}
</style>
