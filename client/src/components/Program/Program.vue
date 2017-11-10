<template>
  <div>
    <Toolbar :title="program.name" class="mdc-toolbar--flexible mdc-toolbar--flexible-default-behavior">
      <section class="mdc-toolbar__section mdc-toolbar__section--align-end" slot="headerActions">
        <button class="material-icons mdc-toolbar__icon mdc-ripple-surface" arial-label="Edit" v-on:click="editProgram">edit</button>
      </section>
    </Toolbar>
    <main class="mdc-toolbar-fixed-adjust" :class="{ empty: episodes.length == 0 }">
      <ProgramDialog></ProgramDialog>
      <div class="program">
        <EpisodeDialog></EpisodeDialog>
        <div v-if="episodes && episodes.length > 0" class="episodes">
          <router-link
            :to="{ name: 'Episode', params: { programId: program._id, episodeId: episode._id }}"
            v-for="episode in episodes"
            :key="episode._id"
            class="episode-card">
            <EpisodeCard :episode="episode"></EpisodeCard>
          </router-link>
        </div>
        <EmptyState v-else></EmptyState>
        <button class="mdc-fab material-icons fab" aria-label="add" data-mdc-auto-init="MDCRipple" v-on:click="addEpisode">
          <span class="mdc-fab__icon">
            add
          </span>
        </button>
      </div>
    </main>
  </div>
</template>

<script>
import Event from '../../utils/EventBus.js'
import ProgramDialog from './ProgramDialog'
import EpisodeCard from '../Episode/EpisodeCard'
import EpisodeDialog from '../Episode/EpisodeDialog'
// import { menu } from 'material-components-web'
import Toolbar from '../Toolbar'
import EmptyState from '../EmptyState'

export default {
  name: 'program',
  components: {
    ProgramDialog,
    EpisodeCard,
    EpisodeDialog,
    Toolbar,
    EmptyState
  },
  data () {
    return {
      program: {},
      episodes: []
    }
  },
  created () {
    this.fetchData()
    Event.$on('program.update', (program, file) => {
      this.updateProgram(program, file)
    })
    Event.$on('program.delete', (program) => {
      this.deleteProgram(program)
    })
    this.$options.sockets['episodes.add'] = (episode) => {
      if (episode.program === this.program._id) {
        Event.$emit('episode.added', episode)
      }
    }
    Event.$on('episode.added', (episode) => {
      const index = this.episodes.indexOf(this.episodes.find(function (programEpisode) {
        return programEpisode._id === episode._id
      }))
      if (index < 0) this.episodes.unshift(episode)
    })
    Event.$on('episode.updated', (episode) => {
      for (let i = 0; i < this.episodes.length; i++) {
        if (this.episodes[i]._id === episode._id) {
          this.episodes[i] = episode
          this.episodes.sort(function (e1, e2) { return e2.number - e1.number })
          this.$forceUpdate()
          break
        }
      }
    })
    Event.$on('episode.deleted', (episode) => {
      const index = this.episodes.indexOf(this.episodes.find(function (programEpisode) {
        return programEpisode._id === episode._id
      }))
      if (index > -1) this.episodes.splice(index, 1)
    })
  },
  watch: {
    // call again the method if the route changes
    '$route': 'fetchData',
    program: function (value) {
      // change the Toolbar's first row background image
      let tbFirstRow = this.$el.querySelector('.mdc-toolbar--flexible .mdc-toolbar__row:first-child')
      let styleElem = tbFirstRow.querySelector('style') ? tbFirstRow.querySelector('style') : tbFirstRow.appendChild(document.createElement('style'))
      styleElem.innerHTML = '.mdc-toolbar--flexible .mdc-toolbar__row:first-child::after { background-image: url(' + (value.thumbnail ? value.thumbnail : require('../../assets/geekinc-logo_512.png')) + '); }'
    }
  },
  methods: {
    fetchData: function () {
      this.program = {} // reset the program
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}`).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          this.program = response.body
          this.$options.sockets[`programs.${this.program._id}`] = (data) => {
            this.program = data
          }
          this.fetchEpisodes()
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    updateProgram: function (program, file) {
      let data = program
      if (typeof file !== 'undefined') {
        data = new FormData()
        data.append('thumbnail', file)
        for (let key in program) {
          if (!(program[key] instanceof Object)) data.append(key, program[key])
        }
      }
      Event.$emit('progressbar.toggle', true)
      this.$http.put(`/api/programs/${program._id}`, data).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          this.program = response.body
          Event.$emit('snackbar.message', `Program ${response.body.name} updated`)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    deleteProgram: function (program) {
      Event.$emit('progressbar.toggle', true)
      this.$http.delete(`/api/programs/${program._id}`).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          window.location = this.$router.resolve({name: 'Programs'}).href
          Event.$emit('snackbar.message', `Program ${program.name} deleted`)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    fetchEpisodes: function () {
      Event.$emit('progressbar.toggle', true)
      this.$http.get(`/api/programs/${this.$route.params.programId}/episodes`).then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          this.episodes = response.body
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    addEpisode: function () {
      Event.$emit('progressbar.toggle', true)
      this.$http.post(`/api/programs/${this.$route.params.programId}/episodes/`).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('episode.added', response.body)
          Event.$emit('snackbar.message', 'Added a new episode')
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    editProgram: function (event) {
      Event.$emit('programDialog.show', this.program)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.episodes {
  margin: 0 auto;
  max-width: 1280px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-flow: row wrap;
      flex-flow: row wrap;
}

main.empty .empty-state {
  max-height: calc(100vh - (5 * 72px)); /* --mdc-toolbar-ratio-to-extend-flexible * 72px */
}

#app.bottombarActive main.empty .empty-state {
  max-height: calc(100vh - (5 * 72px) - 56px); /* --mdc-toolbar-ratio-to-extend-flexible * 72px */
}

@media (max-width: 1280px) {
  main:not(.empty) {
    padding-bottom: 72px;
  }
}

.episodes .episode-card {
  margin: 15px;
  width: calc(100%/3 - 30px);
  height: 12.875rem;
}

@media screen and (max-width: 991px) {
  .episodes .episode-card {
    width: calc((100% / 2) - 30px);
  }
}
@media screen and (max-width: 767px) {
  .episodes .episode-card {
    width: calc(100% - 30px);
  }
}

a.episode-card {
  outline: 0;
  text-decoration: none;
  border: none;
  -moz-outline-style: none;
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
</style>