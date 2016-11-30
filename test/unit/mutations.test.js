import test from 'tape';
// import Vuex from 'vuex';

import store from '../../src/store';

import * as types from '../../lib/mutation-types';

test('cognito mutations', (t) => {
  t.plan(4);

  t.test('SIGNUP', (tt) => {
    const user = {
      username: 'test',
      confirmed: false,
    };

    store.commit(types.SIGNUP_FAILURE, { errorMessage: 'Test message' });
    store.commit(types.SIGNUP, user);

    tt.plan(2);

    tt.equal(store.state.cognito.user, user);
    tt.equal(store.state.cognito.failure, null);

    tt.end();
  });

  t.test('SIGNUP_FAILURE', (tt) => {
    const errorMessage = 'Incorrect username or password';

    store.commit(types.SIGNUP_FAILURE, { errorMessage });

    tt.plan(1);

    tt.equal(store.state.cognito.failure, errorMessage);

    tt.end();
  });

  t.test('CONFIRMED', (tt) => {
    store.commit(types.CONFIRMED_FAILURE, { errorMessage: 'Test message' });
    store.commit(types.CONFIRMED);

    tt.plan(2);

    tt.equal(store.state.cognito.user.confirmed, true);
    tt.equal(store.state.cognito.failure, null);

    tt.end();
  });

  t.test('CONFIRMED_FAILURE', (tt) => {
    const errorMessage = 'Wrong confirmation code';

    store.commit(types.CONFIRMED_FAILURE, { errorMessage });

    tt.plan(1);

    tt.equal(store.state.cognito.failure, errorMessage);

    tt.end();
  });
});
