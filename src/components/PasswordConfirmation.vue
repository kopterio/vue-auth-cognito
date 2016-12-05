<template>
<div class="container">
  <div class="row">
    <div class="col-md-4 col-md-offset-4">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">Password confirmation</h3>
        </div>
        <div class="alert alert-success" v-show="successMessage">
          {{ successMessage }}
        </div>
        <div class="alert alert-danger" v-show="errorMessage">
          {{ errorMessage }}
        </div>
        <div class="panel-body">
          <form accept-charset="UTF-8" role="form" @submit.stop.prevent="handleSubmit">
            <fieldset>
              <div class="form-group">
                <input class="form-control" placeholder="batman" type="text" v-model="username" required min="1" :disabled="disableAllInputs">
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="123456" type="text" v-model="code" min="1" :disabled="disableAllInputs">
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="your password" type="password" v-model="newPassword" min="1" :disabled="disableAllInputs">
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="your password" type="password" v-model="newPasswordConfirmation" min="1" :disabled="disableAllInputs">
              </div>
              <input class="btn btn-lg btn-success btn-block" type="submit" value="Confirm new password" :disabled="protectedUI || !formIsValid || disableAllInputs">
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'PasswordConfirmation',
  data: () => ({
    errorMessage: null,
    successMessage: null,
    disableAllInputs: false,
    protectedUI: false,
    username: '',
    code: '',
    newPassword: '',
    newPasswordConfirmation: '',
  }),
  methods: {
    handleSubmit() {
      // Remove alert boxes
      this.successMessage = null;
      this.errorMessage = null;

      this.protectedUI = true;
      this.$store.dispatch('confirmPassword', {
        username: this.username,
        code: this.code,
        newPassword: this.newPassword,
      }).then(() => {
        this.disableAllInputs = true;
        this.successMessage = 'Successfuly confirmed';
      }).catch((errorMessage) => {
        this.errorMessage = errorMessage;
        this.protectedUI = false;
      });
    },
  },
  computed: {
    formIsValid() {
      return /[\S]+/.test(this.username)
      && this.code.length >= 6
      && /[a-z]+/.test(this.newPassword)
      && /[A-Z]+/.test(this.newPassword)
      && /[0-9]+/.test(this.newPassword)
      && /[!@#$%^&*()_+={}[\]\\;:.,|]+/.test(this.newPassword)
      && this.newPassword.length >= 6
      && this.newPassword === this.newPasswordConfirmation;
    },
  },
};
</script>

<style>
</style>
