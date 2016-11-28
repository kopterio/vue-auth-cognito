import Vue from 'vue';
import Vuex from 'vuex';
// import createLogger from 'vuex/src/plugins/logger';

import CognitoAuth from '../../lib/vuex-module';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    CognitoAuth,
  },
  strict: debug,
  // plugins: debug ? [createLogger()] : [],
});
