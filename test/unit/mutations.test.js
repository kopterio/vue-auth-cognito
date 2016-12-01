import test from 'tape';

import store from '../../src/store';

import * as types from '../../lib/mutation-types';


test('SIGNUP_FAILURE mutation', (tt) => {
  const errorMessage = 'Incorrect username or password';
  store.commit(types.SIGNUP_FAILURE, { errorMessage });
  tt.plan(1);
  tt.equal(store.state.cognito.failure, errorMessage);
  tt.end();
});

test('SIGNUP mutation', (tt) => {
  const user = {
    username: 'test',
    confirmed: false,
  };
  // before testing it works, reset it to a "faulty" state.
  store.commit(types.SIGNUP_FAILURE, { errorMessage: 'Test message' });
  store.commit(types.SIGNUP, user);
  tt.plan(2);
  tt.equal(store.state.cognito.user, user);
  tt.equal(store.state.cognito.failure, null);
  tt.end();
});

test('CONFIRMED_FAILURE mutation', (tt) => {
  const errorMessage = 'Wrong confirmation code';
  store.commit(types.CONFIRMED_FAILURE, { errorMessage });
  tt.plan(1);
  tt.equal(store.state.cognito.failure, errorMessage);
  tt.end();
});

test('CONFIRMED mutation', (tt) => {
  // before testing it works, reset it to a "faulty" state.
  store.commit(types.CONFIRMED_FAILURE, { errorMessage: 'Test message' });
  store.commit(types.CONFIRMED);
  tt.plan(2);
  tt.equal(store.state.cognito.user.confirmed, true);
  tt.equal(store.state.cognito.failure, null);
  tt.end();
});

test('AUTHENTICATE_FAILURE mutation', (tt) => {
  const errorMessage = 'Wrong confirmation code';
  store.commit(types.AUTHENTICATE_FAILURE, { errorMessage });
  tt.plan(2);
  tt.equal(store.state.cognito.user, null, 'should reset stored user');
  tt.equal(store.state.cognito.failure, errorMessage, 'should store error message');
  tt.end();
});

test('AUTHENTICATE mutation', (tt) => {
  const fiveHoursExpiration = new Date().getTime() + (5 * 60 * 60 * 1000);
  const payload = {
    user: {
      confirmed: true,
      username: 'johndoe',
    },
    tokens: {
      id: {
        jwt: 'jvMg5r2h+9Q+MXrI1RZ5qvqq',
        expiration: fiveHoursExpiration,
      },
      access: {
        jwt: 'jvMg5r2h+9Q+MXrI1RZ5qvqq',
        expiration: fiveHoursExpiration,
      },
      refresh: { jwt: 'qFZBZrMcePSAWeMS9dFKE9i7' },
    }
  };

  // before testing it works, reset it to a "faulty" state.
  store.commit(types.AUTHENTICATE_FAILURE, { errorMessage: 'Test message' });
  store.commit(types.AUTHENTICATE, payload);
  tt.plan(8);
  tt.equal(store.state.cognito.failure, null, 'should reset failure to null');
  tt.equal(store.state.cognito.user.username, payload.user.username, 'should store username');
  tt.equal(store.state.cognito.user.confirmed, payload.user.confirmed, 'should store confirmed status');
  tt.equal(store.state.cognito.tokens.id.jwt, 'jvMg5r2h+9Q+MXrI1RZ5qvqq', 'should store proper jwt token');
  tt.equal(store.state.cognito.tokens.id.expiration, fiveHoursExpiration, 'should store id token expiration');
  tt.equal(store.state.cognito.tokens.access.jwt, 'jvMg5r2h+9Q+MXrI1RZ5qvqq', 'should store access token jwt');
  tt.equal(store.state.cognito.tokens.access.expiration, fiveHoursExpiration, 'should store access token expiration');
  tt.equal(store.state.cognito.tokens.refresh.jwt, 'qFZBZrMcePSAWeMS9dFKE9i7', 'should store refresh token jwt');
  tt.end();
});
