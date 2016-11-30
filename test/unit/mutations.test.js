import test from 'tape';
// import Vuex from 'vuex';

import store from '../../src/store';

import * as types from '../../lib/mutation-types';

test('cognito mutations', (t) => {
  t.plan(2);

  t.test('SIGNUP', (tt) => {
    const user = {
      username: 'test',
      confirmed: false,
    };

    store.commit(types.SIGNUP, user);

    tt.plan(1);

    tt.equal(store.state.cognito.user, user);

    tt.end();
  });

  t.test('SIGNUP_FAILURE', (tt) => {
    const errorMessage = 'Incorrect username or password';

    store.commit(types.SIGNUP_FAILURE, { errorMessage });

    tt.plan(1);

    tt.equal(store.state.cognito.failure, errorMessage);

    tt.end();
  });
});
