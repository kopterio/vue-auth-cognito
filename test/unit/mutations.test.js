import test from 'tape';

import store from '../../src/store';

import * as types from '../../lib/mutation-types';

test('SIGNUP mutation', (tt) => {
  const user = {
    username: 'test',
    confirmed: false,
  };
  store.commit(types.SIGNUP, user);
  tt.plan(1);
  tt.equal(store.state.cognito.user, user);
  tt.end();
});

test('CONFIRMED mutation', (tt) => {
  store.commit(types.CONFIRMED);
  tt.plan(1);
  tt.equal(store.state.cognito.user.confirmed, true);
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
    },
  };

  // before testing it works, reset it to a "faulty" state.
  store.commit(types.AUTHENTICATE, payload);
  tt.plan(7);
  tt.equal(store.state.cognito.user.username, payload.user.username, 'should store username');
  tt.equal(store.state.cognito.user.confirmed, payload.user.confirmed, 'should store confirmed status');
  tt.equal(store.state.cognito.tokens.id.jwt, 'jvMg5r2h+9Q+MXrI1RZ5qvqq', 'should store proper jwt token');
  tt.equal(store.state.cognito.tokens.id.expiration, fiveHoursExpiration, 'should store id token expiration');
  tt.equal(store.state.cognito.tokens.access.jwt, 'jvMg5r2h+9Q+MXrI1RZ5qvqq', 'should store access token jwt');
  tt.equal(store.state.cognito.tokens.access.expiration, fiveHoursExpiration, 'should store access token expiration');
  tt.equal(store.state.cognito.tokens.refresh.jwt, 'qFZBZrMcePSAWeMS9dFKE9i7', 'should store refresh token jwt');
  tt.end();
});
