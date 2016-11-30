<template>
<div class="container">
    <div class="row">
      <div class="col-md-4 col-md-offset-4">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">SignUp via site</h3>
         </div>
         <div class="alert alert-danger" v-show="failure">
           {{ failure }}
         </div>

          <div class="panel-body">
            <form accept-charset="UTF-8" role="form" @submit.stop.prevent="handleSubmit">
              <fieldset>
                <div class="form-group">
                  <input class="form-control" placeholder="testusername" name="username" type="text" :value="username">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="yourmail@example.com" name="email" type="text" :value="email">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="John Doe" name="name" type="text" :value="name">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="+155512345" name="phone_number" type="text" :value="phone_number">
                </div>
                <div class="form-group">
                  <input class="form-control" placeholder="Password" name="password" type="password" :value="password" >
                </div>
                <input class="btn btn-lg btn-success btn-block" type="submit" value="SignUp" :disabled="protectedUI">
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
      }).catch(() => { this.protectedUI = false; });
    },
  },
  computed: {
    ...mapGetters([
      'failure',
    ]),
  },
};
</script>

<style>
.white{
    color:#000;
    background-color:#fff;
}

.btn-facebook {
    color: #ffffff;
    -webkit-text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.25);
    text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.25);
    background-color: #2b4b90;
    *background-color: #133783;
    background-image: -moz-linear-gradient(top, #3b5998, #133783);
    background-image: -webkit-gradient(linear, 0 0, 0 100%, from(#3b5998), to(#133783));
    background-image: -webkit-linear-gradient(top, #3b5998, #133783);
    background-image: -o-linear-gradient(top, #3b5998, #133783);
    background-image: linear-gradient(to bottom, #3b5998, #133783);
    background-repeat: repeat-x;
    border-color: #133783 #133783 #091b40;
    border-color: rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.1) rgba(0, 0, 0, 0.25);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ff3b5998', endColorstr='#ff133783', GradientType=0);
    filter: progid:DXImageTransform.Microsoft.gradient(enabled=false);
}

    .btn-facebook:hover,
    .btn-facebook:focus,
    .btn-facebook:active,
    .btn-facebook.active,
    .btn-facebook.disabled,
    .btn-facebook[disabled] {
        color: #ffffff;
        background-color: #133783 !important;
        *background-color: #102e6d !important;
    }

    .btn-facebook:active,
    .btn-facebook.active {
        background-color: #0d2456 \9 !important;
    }
</style>
