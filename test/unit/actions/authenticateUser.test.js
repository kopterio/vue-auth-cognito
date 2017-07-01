import test from 'tape';
import * as sinon from 'sinon';

import { createModule, createSessionStub } from '../helpers';

import * as types from '../../../src/mutation-types';

const payload = {
  username: 'test',
  password: 'Qwerty123!',
};

test('authenticateUser', { timeout: 500 }, (t) => {
  const fm = createModule();

  const promise = fm.module.authenticateUser({ }, payload);

  t.plan(8);

  t.ok('authenticateUser' in fm.module, 'exported actions contain a authenticateUser method');

  t.ok(promise instanceof Promise, 'actions.authenticateUser should return a Promise');
  // AuthenticationDetails test
  t.ok(fm.fake.AuthenticationDetails.called, 'AuthenticationDetails constructor should be called');
  t.ok(fm.fake.AuthenticationDetails.calledOnce, 'AuthenticationDetails constructor should be called once');

  t.deepEqual(fm.fake.AuthenticationDetails.firstCall.args[0],
    {
      Username: payload.username,
      Password: payload.password,
    },
    "AuthenticationDetails constructor's first argument should have { Username, Password } properties");

  // User tests
  t.ok(fm.fake.CognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(fm.fake.CognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(fm.fake.CognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(fm.fake.CognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor should receive { Pool, Username }');
});

test('authenticateUser => onFailure', (t) => {
  const fm = createModule();

  const errorMessage = 'Wrong username or password';

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  fm.fake.CognitoUser.prototype.authenticateUser =
  sinon.spy((authDetails, callbacks) => {
    callbacks.onFailure(fullError);
  });

  t.plan(1);

  fm.module.authenticateUser({ commit: fm.fake.commit }, payload).catch((err) => {
    t.deepEqual(err, fullError, 'authenticateUser should reject with { code, message }');
  });
});

test('authenticateUser => onSuccess', (t) => {
  const sessionInstance = createSessionStub();

  const fm = createModule({
    authenticateUser: (authDetails, callbacks) => {
      callbacks.onSuccess(sessionInstance, true);
    },
  });

  fm.methods.CognitoUser.getUsername.returns(payload.username);

  fm.fake.CognitoUser.authenticateUser =
    sinon.spy((authDetails, callbacks) => {
      callbacks.onSuccess(sessionInstance, true);
    });

  t.plan(6);

  fm.module.authenticateUser({ commit: fm.fake.commit }, payload).then(
    ({ userConfirmationNecessary }) => {
      t.ok(userConfirmationNecessary, true, 'userConfirmationNecessary should be passed to resolve');
    },
  );

  t.ok(fm.methods.CognitoUser.authenticateUser.called, 'cognitoUser.authenticateUser should be called');
  t.ok(fm.methods.CognitoUser.authenticateUser.calledOnce, 'cognitoUser.authenticateUser should be called once');
  t.ok(fm.methods.CognitoUser.authenticateUser.calledWithMatch(
    sinon.match.instanceOf(fm.fake.AuthenticationDetails),
  ), "cognitoUser.authenticateUser's first argument should be AuthenticationDetails");

  t.ok(fm.fake.commit.called, 'commit should be called');
  t.deepEqual(fm.fake.commit.firstCall.args,
    [
      types.AUTHENTICATE,
      {
        username: payload.username,
        tokens: {
          IdToken: 'id',
          AccessToken: 'access',
          RefreshToken: 'refresh',
        },
        attributes: {},
      },
    ],
    `mutation ${types.AUTHENTICATE} should receive user payload`);
});

