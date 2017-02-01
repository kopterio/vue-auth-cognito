<template>
<div class="container">
    <div class="row">
      <div class="col-md-4 col-md-offset-4">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">Sign Up</h3>
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
                  <input class="form-control" placeholder="Email: yourmail@example.com" type="email" v-model="email" required :disabled="disableAllInputs">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="Name: John Doe" type="text" v-model="name" :disabled="disableAllInputs">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="Phone: +155512345" type="text" v-model="phone_number" required :disabled="disableAllInputs">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="Password" type="password" v-model="password" required min="6" pattern="[\S]+" :disabled="disableAllInputs">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="Password confirmation" type="password" v-model="passwordConfirmation" required min="6" pattern="[\S]+" :disabled="disableAllInputs">
                </div>
                <input class="btn btn-lg btn-success btn-block" type="submit" value="Sign Up" :disabled="protectedUI || !formIsValid || disableAllInputs">
              </fieldset>
            </form>
          </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
const uuidV4 = require('uuid/v4');

export default {
  name: 'SignUp',
  data: () => ({
    errorMessage: null,
    successMessage: null,
    disableAllInputs: false,
    protectedUI: false,
    email: '',
    name: '',
    phone_number: '',
    password: '',
    passwordConfirmation: '',
  }),
  methods: {
    handleSubmit() {
      // Remove alert boxes
      this.successMessage = null;
      this.errorMessage = null;

      // Generate UUID v4 for username
      const username = uuidV4();

      this.protectedUI = true;
      this.$store.dispatch('signUp', {
        username,
        password: this.password,
        attributes: {
          email: this.email,
          name: this.name,
          phone_number: this.phone_number,
        },
      }).then(() => {
        this.disableAllInputs = true;
        this.successMessage = 'Successfuly signed up';
      }).catch((err) => {
        this.errorMessage = err.message;
        this.protectedUI = false;
      });
    },
  },
  computed: {
    formIsValid() {
      return /[\S]+/.test(this.username)
      && this.email.indexOf('@') > 1
      && this.name.length > 0
      && /[+-\S]+/.test(this.phone_number)
      && /[a-z]+/.test(this.password)
      && /[A-Z]+/.test(this.password)
      && /[0-9]+/.test(this.password)
      && /[!@#$%^&*()_+={}[\]\\;:.,|]+/.test(this.password)
      && this.password.length >= 6
      && this.password === this.passwordConfirmation;
    },
  },
};
</script>

<style>
input:invalid {
  border-color: red;
}
input[type=text]:valid,
input[type=email]:valid,
input[type=password]:valid {
  border-color: green;
}
</style>
