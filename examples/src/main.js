import Vue from 'vue';
import VueResource from 'vue-resource';

import App from './App';

import store from './store';

Vue.use(VueResource);

const app = new Vue({
  el: '#app',
  store,
  template: '<App/>',
  components: { App },
});

window.Vue = app;
export default app;
