<template>
<div class="container">
    <div class="row">
      <div class="col-md-4 col-md-offset-4">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">SignUp via site</h3>
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
                  <!-- Value at 'username' failed to satisfy constraint: Member must satisfy regular expression pattern: [\p{L}\p{M}\p{S}\p{N}\p{P}]+ -->
                  <input class="form-control" placeholder="testusername" name="username" type="text" v-model="username" required min="1" :disabled="disableAllInputs">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="yourmail@example.com" name="email" type="email" v-model="email" required :disabled="disableAllInputs">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="John Doe" name="name" type="text" v-model="name" :disabled="disableAllInputs">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="+155512345" name="phone_number" type="text" v-model="phone_number" required :disabled="disableAllInputs">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="Password" name="password" type="password" v-model="password" required min="6" pattern="[\S]+" :disabled="disableAllInputs">
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
import { mapGetters } from 'vuex';

export default {
  name: 'SignUp',
  data: () => ({
    successMessage: null,
    disableAllInputs: false,
    protectedUI: false,
    username: '',
    email: '',
    name: '',
    phone_number: '',
    password: '',
  }),
  methods: {
    handleSubmit() {
      this.protectedUI = true;
      this.$store.dispatch('signUp', {
        username: this.username,
        email: this.email,
        name: this.name,
        phone_number: this.phone_number,
        password: this.password,
      }).then(() => {
        this.disableAllInputs = true;
        this.successMessage = 'Successfuly signed up';
      }).catch(() => { this.protectedUI = false; });
    },
  },
  computed: {
    ...mapGetters([
      'failure',
    ]),
    formIsValid() {
      return /[\S]+/.test(this.username)
      && this.email.indexOf('@') > 1
      && this.name.length > 0
      && /[+-\S]+/.test(this.phone_number)
      && /[a-z]+/.test(this.password)
      && /[A-Z]+/.test(this.password)
      && /[0-9]+/.test(this.password)
      && /[!@#$%^&*()_+={}[\]\\;:.,|]+/.test(this.password)
      && this.password.length >= 6;
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
