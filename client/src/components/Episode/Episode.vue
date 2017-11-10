<template>
  <div class="episode">
    <EpisodeDialog></EpisodeDialog>
    <Toolbar :title="episode.name">
      <section class="mdc-toolbar__section mdc-toolbar__section--align-end" slot="headerActions">
        <time v-if="episode.started" >{{ timePlayed | formatTime }}</time>
        <button class="material-icons mdc-toolbar__icon mdc-ripple-surface toggle-menu" arial-label="Menu" data-mdc-auto-init="MDCRipple">more_vert</button>
        <div class="mdc-simple-menu mdc-simple-menu--open-from-top-right" tabindex="-1">
          <ul class="mdc-simple-menu__items mdc-list" role="menu" aria-hidden="true">
            <li class="mdc-list-item" role="menuitem" tabindex="0" v-on:click="editEpisode">Edit</li>
            <li class="mdc-list-item" role="menuitem" tabindex="0" v-on:click="stopEpisode(episode)" v-if="episode.started && !episode.ended">Stop</li>
            <li class="mdc-list-item" role="menuitem" tabindex="0" v-on:click="startEpisode(episode)" v-else>Start</li>
          </ul>
        </div>
      </section>
    </Toolbar>
    <main class="mdc-toolbar-fixed-adjust" :class="{ empty: topics.length == 0 }">
      <TopicDialog></TopicDialog>
      <draggable
        v-if="topics.length > 0"
        element="ul"
        v-model="topics"
        :options="dragOptions"
        @change="itemMoved"
        class="topics mdc-list mdc-list--avatar-list mdc-list--two-line">
        <transition-group name="fade">
          <TopicCard v-for="topic in topics" :key="topic._id" :topic="topic" ></TopicCard>
        </transition-group>
      </draggable>
      <EmptyState v-else></EmptyState>
    </main>
    <button class="mdc-fab material-icons fab" aria-label="add" data-mdc-auto-init="MDCRipple" v-on:click="addTopic">
      <span class="mdc-fab__icon">
        add
      </span>
    </button>
  </div>
</template>

<script>
import Event from '../../utils/EventBus.js'
import { menu } from 'material-components-web'
import EpisodeDialog from './EpisodeDialog'
import draggable from 'vuedraggable'
import TopicCard from '../Topic/TopicCard'
import TopicDialog from '../Topic/TopicDialog'
import Toolbar from '../Toolbar'
import Bottombar from '../Bottombar'
import EmptyState from '../EmptyState'

export default {
  name: 'episode',
  components: {
    EpisodeDialog,
    draggable,
    TopicCard,
    TopicDialog,
    Toolbar,
    Bottombar,
    EmptyState
  },
  computed: {
    dragOptions () {
      return {
        animation: 0,
        handle: '.mdc-list-item__start-detail',
        delay: 0
      }
    },
    playingTopic () {
      return this.topics.find(function (episodeTopic) {
        return episodeTopic.started && !episodeTopic.ended
      })
    }
  },
  data () {
    return {
      episode: {},
      topics: [],
      timePlayed: !this.episode || !this.episode.started ? 0 : (this.episode.ended ? new Date(this.episode.ended).getTime() : new Date().getTime()) - new Date(this.episode.started).getTime()
    }
  },
  created () {
    this.fetchData()
    this.$options.sockets['topics.add'] = (topic) => {
      if (topic.episode === this.episode._id) {
        Event.$emit('topic.added', topic)
      }
    }
    Event.$on('episode.update', (episode) => {
      this.updateEpisode(episode)
    })
    Event.$on('episode.delete', (episode) => {
      this.deleteEpisode(episode)
    })
    Event.$on('episode.updated', (episode) => {
      this.episode = episode
    })
    Event.$on('topic.added', (topic) => {
      const index = this.topics.indexOf(this.topics.find(function (episodeTopic) {
        return episodeTopic._id === topic._id
      }))
      if (index < 0) this.topics.push(topic)
    })
    Event.$on('topic.updated', (topic) => {
      for (let i = 0; i < this.topics.length; i++) {
        if (this.topics[i]._id === topic._id) {
          topic.expanded = this.topics[i].expanded // to keep expanded topics, well... expanded
          this.topics[i] = topic
          this.topics.sort(function (t1, t2) { return t1.position - t2.position })
          this.$forceUpdate()
          break
        }
      }
    })
    Event.$on('topic.deleted', (topic) => {
      const index = this.topics.indexOf(this.topics.find(function (episodeTopic) {
        return episodeTopic._id === topic._id
      }))
      if (index > -1) this.topics.splice(index, 1)
    })
  },
  mounted () {
    this.menu = new menu.MDCSimpleMenu(this.$el.querySelector('.mdc-toolbar__section .mdc-simple-menu'))
    // Add event listener to some button to toggle the menu on and off.
    this.$el.querySelector('.mdc-toolbar__section  .toggle-menu').addEventListener('click', (event) => {
      event.preventDefault()
      this.menu.open = !this.menu.open
    })
  },
  watch: {
    '$route': 'fetchData',
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
  methods: {
    fetchData: function () {
      this.episode = {} // reset the episode
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}`).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          this.episode = response.body
          this.$options.sockets[`episodes.${this.episode._id}`] = (data) => {
            this.episode = data
          }
          this.fetchTopics()
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    editEpisode: function (event) {
      Event.$emit('episodeDialog.show', this.episode)
    },
    updateEpisode: function (episode) {
      Event.$emit('progressbar.toggle', true)
      this.$http.put(`/api/programs/${this.$route.params.programId}/episodes/${episode._id}`, episode).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('episode.updated', response.body)
          Event.$emit('snackbar.message', `Episode ${response.body.name} updated`)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    deleteEpisode: function (episode) {
      Event.$emit('progressbar.toggle', true)
      this.$http.delete(`/api/programs/${this.$route.params.programId}/episodes/${episode._id}`).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          window.location = this.$router.resolve({name: 'Program', params: { programId: this.$route.params.programId }}).href
          Event.$emit('snackbar.message', `Episode ${episode.name} deleted`)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    startEpisode: function (episode) {
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/start`).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('episode.updated', response.body)
          Event.$emit('snackbar.message', `Episode ${response.body.name} started`)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    stopEpisode: function (episode) {
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/stop`).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('episode.updated', response.body)
          Event.$emit('snackbar.message', `Episode ${response.body.name} stopped`)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    fetchTopics: function () {
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics`).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          this.topics = response.body
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    addTopic: function () {
      Event.$emit('progressbar.toggle', true)
      this.$http.post(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/`).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('topic.added', response.body)
          Event.$emit('snackbar.message', 'Added a new topic')
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    moveTopic: function (topic, newPosition) {
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes/${this.$route.params.episodeId}/topics/${topic._id}/move`,
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
        this.moveTopic(event.moved.element, event.moved.newIndex)
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.topics {
  max-width: 1024px;
  margin: 0 auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 1280px) {
  main:not(.empty) {
    padding-bottom: 72px;
  }
}

.fab {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
}

@media(min-width: 1024px) {
   .fab {
    bottom: 1.5rem;
    right: 1.5rem;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0
}

.mdc-toolbar__section.mdc-toolbar__section--align-end time {
  margin: auto 0;
}
</style>
