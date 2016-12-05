<template>
<div class="container">
  <div class="row">
    <div class="col-md-4 col-md-offset-4">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">User confirmation</h3>
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
                <input class="form-control" placeholder="batman" name="username" type="text" v-model="username" required min="1" :disabled="disableAllInputs">
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="123456" name="code" type="text" v-model="code" min="1" :disabled="disableAllInputs">
              </div>
              <div class="form-group" v-show="showResendButton">
                <button class="btn btn-sm btn-info" @click.stop.prevent="resendCode">Resend confirmation code</button>
              </div>
              <div class="alert alert-success" v-show="resendSuccessMessage">
                {{ resendSuccessMessage }}
              </div>
              <div class="alert alert-danger" v-show="resendErrorMessage">
                {{ resendErrorMessage }}
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
export default {
  name: 'UserConfirmation',
  data: () => ({
    errorMessage: null,
    successMessage: null,
    disableAllInputs: false,
    protectedUI: false,
    showResendButton: false,
    resendSuccessMessage: null,
    resendErrorMessage: null,
    username: '',
    code: '',
  }),
  methods: {
    handleSubmit() {
      // Remove alert boxes and resend confirmation parts first
      this.errorMessage = null;
      this.resendSuccessMessage = null;
      this.resendErrorMessage = null;
      this.showResendButton = false;

      // Protect UI from being used
      this.protectedUI = true;

      this.$store.dispatch('confirmRegistration', {
        username: this.username,
        code: this.code,
      }).then(() => {
        this.disableAllInputs = true;
        this.successMessage = 'Successfuly confirmed';
      }).catch((err) => {
        this.errorMessage = err.message;
        this.protectedUI = false;
        if (err.code === 'ExpiredCodeException') {
          this.showResendButton = true;
        }
      });
    },
    resendCode() {
      // Remove alert boxes first
      this.resendSuccessMessage = null;
      this.resendErrorMessage = null;

      this.$store.dispatch('resendConfirmationCode', {
        username: this.username,
      }).then(() => {
        this.showResendButton = false;
        this.resendSuccessMessage = 'Confirmation code has been successfuly sent';
        // Hide success message after 5 seconds
        setTimeout(() => {
          this.resendSuccessMessage = null;
        }, 5000);
      }).catch((err) => {
        this.resendErrorMessage = err.message;
      });
    },
  },
  computed: {
    formIsValid() {
      return /[\S]+/.test(this.username)
      && this.code.length >= 6;
    },
  },
};
</script>

<style>
</style>
