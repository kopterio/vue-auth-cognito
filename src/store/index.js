import Vue from 'vue';
import Vuex from 'vuex';
// import createLogger from 'vuex/src/plugins/logger';

import CognitoAuth from '../../lib';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    cognito: new CognitoAuth,
  },
  strict: debug,
  // plugins: debug ? [createLogger()] : [],
});
