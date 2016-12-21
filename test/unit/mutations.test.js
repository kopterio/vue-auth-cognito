import test from 'tape';
import * as sinon from 'sinon';

import store from '../../src/store';

import * as types from '../../lib/mutation-types';

const cognitoUser = sinon.stub();

test('AUTHENTICATE mutation', { timeout: 500 }, (t) => {
  store.commit(types.AUTHENTICATE, cognitoUser);
  t.plan(1);
  t.equal(store.state.cognito.user, cognitoUser, 'state should keep a CognitoUser object');
});

test('SIGNOUT mutation', { timeout: 500 }, (t) => {
  store.commit(types.SIGNOUT);
  t.plan(1);
  t.equal(store.state.cognito.user, null);
});
