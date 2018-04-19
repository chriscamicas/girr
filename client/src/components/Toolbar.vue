<template>
  <header class="mdc-toolbar mdc-toolbar--fixed mdc-toolbar--waterfall">
    <div class="mdc-toolbar__row">
      <section class="mdc-toolbar__section mdc-toolbar__section--align-start">
        <a class="material-icons mdc-toolbar__menu-icon mdc-ripple-surface menu" aria-label="Menu" alt="Menu" data-mdc-auto-init="MDCRipple">menu</a>
        <span class="mdc-toolbar__title">{{ title }}</span>
      </section>
      <slot name="headerActions"></slot>
    </div>
    <div role="progressbar" class="mdc-linear-progress">
      <div class="mdc-linear-progress__buffering-dots"></div>
      <div class="mdc-linear-progress__buffer"></div>
      <div class="mdc-linear-progress__bar mdc-linear-progress__primary-bar">
        <span class="mdc-linear-progress__bar-inner"></span>
      </div>
      <div class="mdc-linear-progress__bar mdc-linear-progress__secondary-bar">
        <span class="mdc-linear-progress__bar-inner"></span>
      </div>
    </div>
    <drawer></drawer>
  </header>
</template>

<script>
import Drawer from './Drawer'
import Event from '../utils/EventBus.js'
import { toolbar } from 'material-components-web'
// toolbar.MDCToolbar.attachTo(document.querySelector('.mdc-toolbar'))
// tb.fixedAdjustElement = document.querySelector('.mdc-toolbar-fixed-adjust')

export default {
  name: 'Toolbar',
  props: ['title', 'classes'],
  components: { Drawer },
  mounted: function () {
    Event.$on('progressbar.toggle', this.toggleProgressBar)
    this.$el.querySelector('.menu').addEventListener('click', function () {
      Event.$emit('drawer.toggle', true)
    })

    this.tb = toolbar.MDCToolbar.attachTo(this.$el)
    this.tb.fixedAdjustElement = document.querySelector('.mdc-toolbar-fixed-adjust')
    this.tb.listen('MDCToolbar:change', (evt) => {
      let flexibleExpansionRatio = evt.detail.flexibleExpansionRatio
      if (flexibleExpansionRatio > 0) {
        this.$el.querySelector('.mdc-toolbar__row:first-child').classList.add('flex')
      } else {
        this.$el.querySelector('.mdc-toolbar__row:first-child').classList.remove('flex')
      }
    })
  },
  watch: {
    title: function (newTitle) {
      document.title = `${newTitle} - GIRR`
    }
  },
  methods: {
    toggleProgressBar: function (bool) {
      if (bool) {
        this.$el.querySelector('.mdc-linear-progress').classList.add('mdc-linear-progress--indeterminate')
      } else {
        this.$el.querySelector('.mdc-linear-progress').classList.remove('mdc-linear-progress--indeterminate')
      }
    }
  }
}
</script>

<style scoped>
.mdc-toolbar__section.mdc-toolbar__section--align-end {
  margin-right: 10px;
}

.mdc-toolbar__section.mdc-toolbar__section--align-end .mdc-icon-toggle::before,
.mdc-toolbar__section.mdc-toolbar__section--align-end .mdc-icon-toggle::after {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.mdc-toolbar--flexible {
  --mdc-toolbar-ratio-to-extend-flexible: 5;
}

.mdc-toolbar--flexible .mdc-toolbar__row:first-child::after {
  background-size: cover;
  background-position: center;
}

.mdc-toolbar--flexible .mdc-toolbar__row:first-child:not(.flex) .mdc-toolbar__section {
  align-items: center;
}

.mdc-toolbar--flexible .mdc-toolbar__row:first-child.flex .mdc-toolbar__title {
  text-shadow: 1px 1px #000000;
}

.mdc-toolbar--flexible .mdc-toolbar__row:first-child.flex .material-icons {
  color: var(--mdc-theme-text-secondary-on-light,rgba(0,0,0,.54));
}
</style>