<template>
  <div>
    <Toolbar :title="programs.length + ' Programs'"></Toolbar>
    <main class="mdc-toolbar-fixed-adjust" :class="{ empty: programs.length == 0 }">
      <div v-if="programs.length > 0" class="programs">
        <ProgramDialog></ProgramDialog>
        <router-link
          :to="{ name: 'Program', params: { programId: program._id }}"
          v-for="program in programs"
          :key="program._id"
          class="program-card">
          <ProgramCard :program="program"></ProgramCard>
        </router-link>
      </div>
      <EmptyState v-else></EmptyState>
      <button class="mdc-fab material-icons fab" aria-label="add" data-mdc-auto-init="MDCRipple" v-on:click="addProgram">
        <span class="mdc-fab__icon">
          add
        </span>
      </button>
    </main>
  </div>
</template>

<script>
import Event from '../../utils/EventBus.js'
import ProgramCard from './ProgramCard'
import ProgramDialog from './ProgramDialog'
import Toolbar from '../Toolbar'
import EmptyState from '../EmptyState'

export default {
  name: 'programs',
  components: {
    ProgramCard,
    ProgramDialog,
    Toolbar,
    EmptyState
  },
  data () {
    return {
      programs: []
    }
  },
  created () {
    this.getPrograms()
    this.$options.sockets['programs.add'] = function (program) {
      Event.$emit('program.added', program)
    }
    this.$options.sockets['programs.delete'] = function (program) {
      Event.$emit('program.deleted', program)
    }
    Event.$on('program.added', (program) => {
      const index = this.programs.indexOf(this.programs.find(function (listProgram) {
        return listProgram._id === program._id
      }))
      if (index < 0) this.programs.push(program)
    })
    Event.$on('program.updated', (program) => {
      for (let i = 0; i < this.programs.length; i++) {
        if (this.programs[i]._id === program._id) {
          this.programs[i] = program
          this.$forceUpdate()
          break
        }
      }
    })
    Event.$on('program.deleted', (program) => {
      const index = this.programs.indexOf(this.programs.find(function (listProgram) {
        return listProgram._id === program._id
      }))
      if (index > -1) this.programs.splice(index, 1)
    })
  },
  watch: {
    // call again the method if the route changes
    '$route': 'getPrograms'
  },
  methods: {
    getPrograms: function () {
      Event.$emit('progressbar.toggle', true)
      this.$http.get('/api/programs').then(
        (response) => {
          Event.$emit('progressbar.toggle', false)
          this.programs = response.body
          Event.$emit('title.change', this.programs.length + ' Programs')
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('http.error', response)
        }
      )
    },
    addProgram: function () {
      Event.$emit('progressbar.toggle', true)
      this.$http.post('/api/programs').then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('program.added', response.body)
          Event.$emit('snackbar.message', `Added ${response.body.name}`)
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
.programs {
  margin: 0 auto;
  max-width: 1280px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-flow: row wrap;
      flex-flow: row wrap;
}

@media (max-width: 1280px) {
  main:not(.empty) {
    padding-bottom: 72px;
  }
}

.programs .program-card {
  margin: 15px;
  width: calc(100% - 30px);
  height: 21.875rem;
  -webkit-transition: all 0.2s ease-in-out;
  transition: all 0.2s ease-in-out;
}

.program.mdc-card section {
  background: rgba(0, 0, 0, .4);
}

a {
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
</style>
