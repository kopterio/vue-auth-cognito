<template>
<div class="container">
  <div class="row">
    <div class="col-md-4 col-md-offset-4">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">Confirmation</h3>
        </div>
        <div class="alert alert-success" v-show="successMessage">
          {{ successMessage }}
        </div>
        <div class="alert alert-danger" v-show="failure">
          {{ failure }}
        </div>
        <div class="panel-body">
          <form accept-charset="UTF-8" role="form" @submit.stop.prevent="handleSubmit">
            <fieldset>
              <div class="form-group">
                <input class="form-control" placeholder="batman" name="username" type="text" v-model="username" required min="1" :disabled="disableAllInputs">
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="123456" name="code" type="text" v-model="code" min="1" :disabled="disableAllInputs">
              </div>
              <input class="btn btn-lg btn-success btn-block" type="submit" value="Confirm" :disabled="protectedUI || !formIsValid || disableAllInputs">
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Confirmation',
  data: () => ({
    successMessage: null,
    disableAllInputs: false,
    protectedUI: false,
    username: '',
    code: '',
  }),
  methods: {
    handleSubmit() {
      this.protectedUI = true;
      this.$store.dispatch('confirmRegistration', {
        username: this.username,
        code: this.code,
      }).then(() => {
        this.disableAllInputs = true;
        this.successMessage = 'Successfuly confirmed';
      }).catch(() => { this.protectedUI = false; });
    },
  },
  computed: {
    ...mapGetters([
      'failure',
    ]),
    formIsValid() {
      return /[\S]+/.test(this.username)
      && this.code.length === 6;
    },
  },
};
</script>

<style>
</style>
