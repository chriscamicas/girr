<template>
  <aside id="program-dialog"
    class="mdc-dialog"
    role="alertdialog"
    aria-labelledby="my-mdc-dialog-label"
    aria-describedby="my-mdc-dialog-description">
    <div class="mdc-dialog__surface">
      <header class="mdc-dialog__header">
        <h2 id="my-mdc-dialog-label" class="mdc-dialog__header__title">
          {{ title || $t('program.unnamed') }}
        </h2>
      </header>
      <section id="my-mdc-dialog-description" class="mdc-dialog__body mdc-dialog__body--scrollable">
        <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--with-trailing-icon" v-bind:class="{ 'mdc-text-field--upgraded' : program.name }">
          <i class="material-icons mdc-text-field__icon" tabindex="0">label</i>
          <input type="text" id="name" class="mdc-text-field__input" v-model.lazy="program.name" v-on:keyup.enter="confirm">
          <label for="name" class="mdc-text-field__label" v-bind:class="{ 'mdc-text-field__label--float-above' : program.name }">{{ $t('program.name_label') }}</label>
        </div>
        <div class="picture thumbnail" v-on:click="$event.currentTarget.querySelector('input').click()">
          <i class="material-icons">edit</i>
          <img :src="program.thumbnail"/>
          <input type="file" name="thumbnail" accept="image/*" class="input-file" v-on:change="fileChange($event);" style="display: none;">
        </div>
        <div class="picture logo" v-on:click="$event.currentTarget.querySelector('input').click()">
          <i class="material-icons">edit</i>
          <img :src="program.logo"/>
          <input type="file" name="logo" accept="image/*" class="input-file" v-on:change="fileChange($event);" style="display: none;">
        </div>
        <div class="picture logoBW" v-on:click="$event.currentTarget.querySelector('input').click()">
          <i class="material-icons">edit</i>
          <img :src="program.logoBW"/>
          <input type="file" name="logoBW" accept="image/*" class="input-file" v-on:change="fileChange($event);" style="display: none;">
        </div>
        <div class="picture background" v-on:click="$event.currentTarget.querySelector('input').click()">
          <i class="material-icons">edit</i>
          <img :src="program.background"/>
          <input type="file" name="background" accept="image/*" class="input-file" v-on:change="fileChange($event);" style="display: none;">
        </div>
         <div class="mdc-text-field mdc-text-field--fullwidth mdc-text-field--with-trailing-icon" v-bind:class="{ 'mdc-text-field--upgraded' : program.primarycolor }">
              
          <label for="primarycolor" class="mdc-text-field__label" v-bind:class="{ 'mdc-text-field__label--float-above' : program.primarycolor }">{{ $t('program.primarycolor_label') }}</label>
          <input type="color" id="primarycolor" class="mdc-text-field__input" v-model.lazy="program.primarycolor" v-on:keyup.enter="confirm">
        </div>
      </section>
      <footer class="mdc-dialog__footer">
        <button type="button" class="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--delete" v-on:click="deleteProgram(program)">
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

export default {
  name: 'ProgramDialog',
  data () {
    return {
      dialog: null,
      title: null,
      program: {}
    }
  },
  mounted () {
    this.dialog = new dialog.MDCDialog(this.$el)
    textField.MDCTextField.attachTo(this.$el.querySelector('.mdc-text-field'))
    Event.$off('programDialog.show').$on('programDialog.show', this.show)
    Event.$off('programDialog.close').$on('programDialog.close', this.close)
    this.dialog.focusTrap_.activate = () => {
      this.$el.querySelector('input#name').select()
    }
  },
  methods: {
    show: function (program) {
      this.title = program.name
      this.program = assign({}, program)
      this.$el.querySelector('input[type=file]').value = null
      this.dialog.show()
    },
    close: function () {
      this.dialog.close()
    },
    confirm: function () {
      this.$el.querySelector('.mdc-dialog__footer__button--accept').disabled = true
      this.updateProgram(this.program, this.$el.querySelectorAll('input[type=file]'))
        .then(response => this.close())
        .finally(() => {
          this.$el.querySelector('.mdc-dialog__footer__button--accept').disabled = false
        })
    },
    fileChange: function (event) {
      if (event.target.files.length > 0) {
        let FR = new FileReader()
        FR.addEventListener('load', (e) => {
          event.target.parentNode.querySelector('img').src = e.target.result
        })
        FR.readAsDataURL(event.target.files[0])
      }
    },
    updateProgram: function (program, inputs) {
      let data = program
      if (typeof inputs !== 'undefined') {
        data = new FormData()
        inputs.forEach(function (input) {
          if (input.files[0]) {
            data.append(input.name, input.files[0])
          }
        })
        for (let key in program) {
          if (!(program[key] instanceof Object)) {
            data.append(key, program[key])
          }
        }
      }
      Event.$emit('progressbar.toggle', true)
      return this.$http.put(`/api/programs/${program._id}`, data)
        .then((response) => Event.$emit('program.updated', response.body))
        .catch(error => {
          Event.$emit('http.error', error)
          return Promise.reject(error)
        })
        .finally(() => Event.$emit('progressbar.toggle', false))
    },
    deleteProgram: function (program) {
      Event.$emit('progressbar.toggle', true)
      return this.$http.delete(`/api/programs/${program._id}`)
        .then((response) => {
          Event.$emit('program.deleted', program)
          this.close()
          window.location = this.$router.resolve({name: 'Programs'}).href
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

.mdc-dialog__body--scrollable {
  max-height: calc(80vh - 56px - 52px); /* main - header - footer */
}

.mdc-dialog__body .picture {
  position: relative;
  cursor: pointer;
  text-align: center;
}

.mdc-dialog__body .picture .material-icons {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px;
}

.mdc-dialog__body .picture:not(:hover) .material-icons {
  display: none;
}

.mdc-dialog__body .picture img {
  object-fit: contain;
  min-height: 100px;
  width: 100%;
  background: transparent;
  background-repeat: no-repeat;
  background-position: center center;
}

#primarycolor{
  margin-top: 12px;
}

.mdc-dialog__body .picture.thumbnail img {
  background-image: url("\
  data:image/svg+xml;utf8, \
    <svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='170px' height='50px'> \
      <text x='85' y='28' \
        style='text-anchor: middle' font-size='16'> \
        Thumbnail \
      </text> \
    </svg>\
  ");
}

.mdc-dialog__body .picture.logo,
.mdc-dialog__body .picture.logoBW,
.mdc-dialog__body .picture.background
 {
  display: inline-block;
  width: calc(50% - 4px);
}

.mdc-dialog__body .picture.logo img {
  background-image: url("\
  data:image/svg+xml;utf8, \
    <svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='170px' height='50px'> \
      <text x='85' y='28' \
        style='text-anchor: middle' font-size='16'> \
        Logo \
      </text> \
    </svg>\
  ");
}

.mdc-dialog__body .picture.logoBW img {
  background-image: url("\
  data:image/svg+xml;utf8, \
    <svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='170px' height='50px'> \
      <text x='85' y='28' \
        style='text-anchor: middle' font-size='16'> \
        Logo Black and White \
      </text> \
    </svg>\
  ");
}

.mdc-dialog__body .picture.background img {
  background-image: url("\
  data:image/svg+xml;utf8, \
    <svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='170px' height='50px'> \
      <text x='85' y='28' \
        style='text-anchor: middle' font-size='16'> \
        Background incruste \
      </text> \
    </svg>\
  ");
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
  margin-right: auto;
}
</style>
