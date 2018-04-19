<template>
  <div class="program mdc-card mdc-card--theme-dark " :style="{ 'background-image': program.thumbnail ? 'url(' + program.thumbnail + ')' : null }">
    <section class="mdc-card__primary mdc-menu-anchor">
      <h1 class="mdc-card__title mdc-card__title--large">{{ program.name }}</h1>
      <h2 class="mdc-card__subtitle">Added {{ program.created | formatDate }}</h2>
      <i class="mdc-icon-toggle material-icons toggle-menu" arial-label="Menu">more_vert</i>
      <div class="mdc-simple-menu mdc-simple-menu--open-from-bottom-right" tabindex="-1">
        <ul class="mdc-simple-menu__items mdc-list" role="menu" aria-hidden="true">
          <li class="mdc-list-item" role="menuitem" tabindex="0" v-on:click="editProgram($event)">Edit</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script>
import Event from '../../utils/EventBus.js'
import { menu } from 'material-components-web'

export default {
  props: ['program'],
  created () {
    this.$options.sockets[`programs.${this.program._id}.delete`] = function (data) {
      Event.$emit('program.deleted', data)
    }
    this.$options.sockets[`programs.${this.program._id}`] = function (data) {
      Event.$emit('program.updated', data)
    }
  },
  mounted () {
    this.menu = new menu.MDCSimpleMenu(this.$el.querySelector('.mdc-simple-menu'))
    // Add event listener to some button to toggle the menu on and off.
    this.$el.querySelector('.toggle-menu').addEventListener('click', (event) => {
      event.preventDefault()
      this.menu.open = !this.menu.open
    })
  },
  methods: {
    editProgram: function (event) {
      event.preventDefault()
      event.stopPropagation()
      Event.$emit('programDialog.show', this.program)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.program.mdc-card  {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: url("../../assets/geekinc-logo_512.png");
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  -webkit-transition: all 0.2s ease-in-out;
  transition: all 0.2s ease-in-out;
}

.program.mdc-card section {
  background: rgba(0, 0, 0, .4);
  text-align: center;
}

.program .mdc-icon-toggle::before,
.program .mdc-icon-toggle::after {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.program .toggle-menu {
  position: absolute;
  bottom: 0;
  right: 0;
  color: white;
}

@media screen and (min-width: 840px) {
  .program:not(:hover) .toggle-menu {
    display: none;
  }
}

.program .mdc-simple-menu {
  bottom: 0;
  right: 0;
  top: inherit  !important;
  left: inherit !important;
}
</style>
