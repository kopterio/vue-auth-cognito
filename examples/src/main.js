import Vue from 'vue';

import App from './App';

import store from './store';

const app = new Vue({
  el: '#app',
  store,
  template: '<App/>',
  components: { App },
});

window.Vue = app;
export default app;
