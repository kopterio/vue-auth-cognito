import Vue from 'vue';
import Vuex from 'vuex';
import test from 'tape';

import * as types from '../../src/mutation-types';

import AuthCognito from '../../src';

import fakeCognitoConfig from './config';

Vue.use(Vuex);
const store = new Vuex.Store({
  modules: {
    cognito: new AuthCognito(fakeCognitoConfig),
  },
});

test('AUTHENTICATE mutation', { timeout: 500 }, (t) => {
  const testUser = {
    username: 'username',
    tokens: {
      IdToken: '',
      RefreshToken: '',
      AccessToken: '',
    },
  };

  store.commit(types.AUTHENTICATE, testUser);
  t.plan(1);
  t.deepEqual(store.state.cognito.user, testUser, 'state should keep user');
});

test('SIGNOUT mutation', { timeout: 500 }, (t) => {
  store.commit(types.SIGNOUT);
  t.plan(1);
  t.equal(store.state.cognito.user, null);
});
