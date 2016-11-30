<template>
  <div id="app">
    <SignUp></SignUp>
    <Confirmation></Confirmation>
    <Login></Login>
  </div>
</template>

<script>
import Login from './components/Login';
import SignUp from './components/SignUp';
import Confirmation from './components/Confirmation';

export default {
  name: 'app',
  components: {
    Login,
    SignUp,
    Confirmation,
  },
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
