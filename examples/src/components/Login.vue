<template>
<div class="container">
  <div class="row">
    <div class="col-md-4 col-md-offset-4">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">Login</h3>
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
                <input class="form-control" placeholder="testusername" name="username" type="text" v-model="username" required min="1" :disabled="disableAllInputs">
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="Password" name="password" type="password" v-model="password" required min="6" pattern="[\S]+" :disabled="disableAllInputs">
                <p class="form-text text-muted">
                  Your password must be at least 6 characters long, contain letters and numbers and special symbols, and must not contain spaces.
                </p>
              </div>
              <!--<div class="checkbox">
                <label>
                  <input name="remember" type="checkbox" value="Remember Me"> Remember Me
                </label>
              </div>-->
              <input class="btn btn-lg btn-success btn-block" type="submit" value="Login" :disabled="protectedUI || !formIsValid || disableAllInputs">
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
  name: 'Login',
  data: () => ({
    errorMessage: null,
    successMessage: null,
    disableAllInputs: false,
    protectedUI: false,
    username: '',
    password: '',
  }),
  methods: {
    handleSubmit() {
      // Remove alert boxes
      this.successMessage = null;
      this.errorMessage = null;

      this.protectedUI = true;
      this.$store.dispatch('authenticateUser', {
        username: this.username,
        password: this.password,
      }).then(() => {
        this.disableAllInputs = true;
        this.password = '';
        this.errorMessage = null;
        this.successMessage = 'Successfuly signed in';
      }).catch((err) => {
        this.errorMessage = err.message;
        this.protectedUI = false;
      });
    },
  },
  computed: {
    formIsValid() {
      return /[\S]+/.test(this.username);
    },
  },
};
</script>

<style>
</style>
