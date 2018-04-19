<template>
  <aside id="program-dialog"
    class="mdc-dialog"
    role="alertdialog"
    aria-labelledby="my-mdc-dialog-label"
    aria-describedby="my-mdc-dialog-description">
    <div class="mdc-dialog__surface">
      <header class="mdc-dialog__header">
        <h2 id="my-mdc-dialog-label" class="mdc-dialog__header__title">
          {{ program.name }}
        </h2>
      </header>
      <section id="my-mdc-dialog-description" class="mdc-dialog__body mdc-dialog__body--scrollable">
        <div class="mdc-textfield mdc-textfield--fullwidth mdc-textfield--with-trailing-icon" v-bind:class="{ 'mdc-textfield--upgraded' : program.name }">
          <i class="material-icons mdc-textfield__icon" tabindex="0">label</i>
          <input type="text" id="name" class="mdc-textfield__input" :value="program.name" v-model.lazy="program.name">
          <label for="name" class="mdc-textfield__label" v-bind:class="{ 'mdc-textfield__label--float-above' : program.name }">Name</label>
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
      </section>
      <footer class="mdc-dialog__footer">
        <div style="margin-right: auto;">
          <button type="button" class="mdc-button mdc-dialog__footer__button mdc-dialog__footer__button--delete" v-on:click="deleteProgram(program)">
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

export default {
  name: 'ProgramDialog',
  data () {
    return {
      dialog: null,
      program: {}
    }
  },
  mounted () {
    this.dialog = new dialog.MDCDialog(this.$el)
    textfield.MDCTextfield.attachTo(this.$el.querySelector('.mdc-textfield'))
    Event.$on('programDialog.show', this.show)
    Event.$on('programDialog.close', this.close)
  },
  methods: {
    show: function (program) {
      this.program = assign({}, program)
      this.$el.querySelector('input[type=file]').value = null
      this.dialog.show()
    },
    close: function () {
      this.dialog.close()
    },
    confirm: function () {
      // Event.$emit('program.update', this.program, this.$el.querySelectorAll('input[type=file]'))
      this.updateProgram(this.program, this.$el.querySelectorAll('input[type=file]'))
      this.close()
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
    delete: function () {
      Event.$emit('program.delete', this.program)
      this.close()
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
      this.$http.put(`/api/programs/${program._id}`, data).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('program.updated', response.body)
          Event.$emit('snackbar.message', `Program ${response.body.name} updated`)
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          console.error(response)
          Event.$emit('snackbar.message', `Error : ${response.statusText ? response.statusText : 'no connection'}`)
        }
      )
    },
    deleteProgram: function (program) {
      Event.$emit('progressbar.toggle', true)
      this.$http.delete(`/api/programs/${program._id}`).then(
        function (response) {
          Event.$emit('progressbar.toggle', false)
          Event.$emit('program.deleted', program)
          Event.$emit('snackbar.message', 'Program ' + program.name + ' deleted')
          this.close()
          window.location = this.$router.resolve({name: 'Programs'}).href
        },
        function (response) {
          Event.$emit('progressbar.toggle', false)
          console.error(response)
          Event.$emit('snackbar.message', `Error : ${response.statusText ? response.statusText : 'no connection'}`)
        }
      )
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
.mdc-dialog__body .picture.logoBW {
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

/* fix mdc-textfield--fullwidth padding */
.mdc-textfield--fullwidth:not(.mdc-textfield--textarea) .mdc-textfield__input {
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
}
</style>
