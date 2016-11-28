import Vue from 'vue';
import Vuex from 'vuex';
// import createLogger from 'vuex/src/plugins/logger';

import auth from './modules/auth';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    auth,
  },
  strict: debug,
  // plugins: debug ? [createLogger()] : [],
});
