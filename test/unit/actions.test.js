import test from 'tape';
import proxyquire from 'proxyquire';
import * as sinon from 'sinon';

import * as types from '../../lib/mutation-types';

const fakeCognitoConfig = {
  Region: 'us-east-1',
  UserPoolId: 'us-east-1_xxxxxxxxx',
  ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
  IdentityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
};

// fixture for user details
const userInfo = {
  username: 'test',
  password: 'Qwerty123!',
  email: 'test@test.com',
  name: 'MegaTest',
  phone_number: '+15553334444',
};

test('cognito signUp', (t) => {
  const FakeCognitoUserPool = sinon.stub();
  const cSignUp = FakeCognitoUserPool.prototype.signUp = sinon.stub();

  const actions = proxyquire('../../lib/actions', {
    'amazon-cognito-identity-js/src/CognitoUserPool': { default: FakeCognitoUserPool },
  }).default(fakeCognitoConfig); // call the default exported function with config

  t.plan(3);
  t.assert('signUp' in actions, 'exported actions contain a signUp method');

  t.test('successful signup', (tt) => {
    const commitSpy = sinon.spy();

    // call the signUp action as if it is called by vuex
    actions.signUp({ commit: commitSpy }, userInfo);

    tt.plan(6);

    tt.ok(cSignUp.called, 'cognitoUserPool.signUp should be called');
    tt.ok(cSignUp.calledOnce, 'cognitoUserPool.signUp should be called exactly once');
    tt.ok(cSignUp.calledWith(userInfo.username, userInfo.password),
      'cognitoUserPool.signUp first two arguments should be username and password');

    // CognitoUserPool.signUp calls a callback
    cSignUp.callArgWith(4, null, {
      user: { username: userInfo.username },
      userConfirmed: false,
    });

    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.withArgs(types.SIGNUP, {
      username: userInfo.username,
      confirmed: false,
    }), `mutation '${types.SIGNUP}' should receive payload: {user, confirmed}`);

    tt.end();
  });

  t.test('failed signup', (tt) => {
    const commitSpy = sinon.spy();

    // call the signUp action as if it is called by vuex
    actions.signUp({ commit: commitSpy }, userInfo);

    const errorMessage = 'Incorrect username or password';

    // CognitoUserPool.signUp calls the callback with an error!
    cSignUp.callArgWith(4, {
      code: 'NotAuthorizedException',
      message: errorMessage,
      name: 'NotAuthorizedException',
      retryDelay: 59.43,
    }, null);

    tt.plan(3);
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.withArgs(types.SIGNUP_FAILURE, { errorMessage }),
      `mutation '${types.SIGNUP_FAILURE}' should receive payload: { error_message }`);

    tt.end();
  });

  t.end();
});
