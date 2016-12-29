import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import cognitoConfig from '../../config/cognito';
import CognitoAuth from '../../../src';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';
const devenv = process.env.NODE_ENV === 'dev';

export default new Vuex.Store({
  modules: {
    cognito: new CognitoAuth(cognitoConfig),
  },
  strict: debug,
  plugins: devenv ? [createLogger()] : [],
});
