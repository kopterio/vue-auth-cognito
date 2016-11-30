<template>
<div class="container">
  <div class="row">
    <div class="col-md-4 col-md-offset-4">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">Login</h3>
        </div>
        <div class="panel-body">
          <form accept-charset="UTF-8" role="form">
            <fieldset>
              <div class="form-group">
                <input class="form-control" placeholder="batman" name="username" type="text" :value="username">
              </div>
              <div class="form-group">
                <input class="form-control" placeholder="123456" name="code" type="text" :value="code" min="6" max="6">
              </div>
              <input class="btn btn-lg btn-success btn-block" type="submit" value="Login">
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
  name: 'Confirmation',
  data: () => ({
    username: '',
    code: '',
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
    formIsValid() {
      return /[\S]+/.test(this.username)
      && this.email.indexOf('@') > 1
      && this.code.length === 6;
    },
  },
};
</script>

<style>
</style>
