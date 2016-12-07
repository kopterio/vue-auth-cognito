import test from 'tape';
import * as sinon from 'sinon';

import CognitoUserPool from 'amazon-cognito-identity-js/src/CognitoUserPool';
import CognitoUser from 'amazon-cognito-identity-js/src/CognitoUser';

import store from '../../src/store';

import * as types from '../../lib/mutation-types';

const fakeCognitoConfig = {
  Region: 'us-east-1',
  UserPoolId: 'us-east-1_xxxxxxxxx',
  ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
  IdentityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

const cognitoUserPool = new CognitoUserPool({
  UserPoolId: fakeCognitoConfig.UserPoolId,
  ClientId: fakeCognitoConfig.ClientId,
  Paranoia: 6,
});

const cognitoUser = new CognitoUser({
  Pool: cognitoUserPool,
  Username: 'test',
});

test('AUTHENTICATE mutation', (t) => {
  store.commit(types.AUTHENTICATE, cognitoUser);
  t.plan(2);
  t.equal(store.state.cognito.user, cognitoUser);
  t.ok(store.state.cognito.user instanceof CognitoUser);
  t.end();
});

test('SIGNOUT mutation', (t) => {
  store.commit(types.SIGNOUT);
  t.plan(1);
  t.equal(store.state.cognito.user, null);
  t.end();
});
