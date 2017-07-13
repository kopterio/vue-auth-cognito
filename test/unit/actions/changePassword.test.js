import test from 'tape';
import * as sinon from 'sinon';

import { createModule } from '../helpers';

const payload = {
  oldPassword: 'test',
  newPassword: 'test1',
};

const state = {
  user: {
    username: 'test',
    tokens: {
      IdToken: 'id',
      AccessToken: 'access',
      RefreshToken: 'refresh',
    },
  },
};

test('changePassword', { timeout: 500 }, (t) => {
  const fm = createModule();

  const promise = fm.module.changePassword({ state }, payload);

  t.plan(7);

  t.ok('changePassword' in fm.module, 'exported actions contain a changePassword method');
  t.ok(promise instanceof Promise, 'changePassword returns a Promise');

  // User tests
  t.ok(fm.fake.CognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(fm.fake.CognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(fm.fake.CognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(fm.fake.CognitoUserPool),
    Username: state.user.username,
  })), 'CognitoUser constructor should receive { Pool, Username }');

  // Session constructor tests
  t.ok(fm.methods.CognitoUser.getCognitoUserSession.calledOnce, 'cognitoUser.getCognitoUserSession constructor should be called once');
  t.ok(fm.methods.CognitoUser.getCognitoUserSession.calledWithMatch(sinon.match(state.user.tokens)), 'cognitoUser.getCognitoUserSession constructor should receive { Pool, Username }');
});

test('rejects when state.user is null', (tt) => {
  const fm = createModule();

  tt.plan(1);

  const fullError = {
    message: 'User is unauthenticated',
  };

  fm.module.changePassword({ state: { user: null } }).catch(
    (err) => {
      tt.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
    },
  );
});

test('rejects when state.user.tokens is null', (tt) => {
  const fm = createModule();

  tt.plan(1);

  const fullError = {
    message: 'User is unauthenticated',
  };

  fm.module.changePassword({ state: { user: { tokens: null } } }).catch(
    (err) => {
      tt.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
    },
  );
});

test('success', (tt) => {
  const fm = createModule();

  fm.methods.CognitoUser.changePassword.withArgs(payload.oldPassword, payload.newPassword).yields(null, 'SUCCESS');

  fm.module.changePassword({ state }, payload).then(
    () => {
      tt.pass('changePassword returned promise.resolve() was called');
    },
  );

  tt.plan(4);

  tt.ok(fm.methods.CognitoUser.changePassword.called, 'changePassword should be called');
  tt.ok(fm.methods.CognitoUser.changePassword.calledOnce, 'changePassword should be called once');
  tt.ok(fm.methods.CognitoUser.changePassword.calledWith(payload.oldPassword, payload.newPassword),
    'cognitoUser.changePassword first two arguments should be oldPassword and newPassword');
});

test('failure', (tt) => {
  const fm = createModule();

  const errorMessage = 'Something went wrong';

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  fm.methods.CognitoUser.changePassword.withArgs(payload.oldPassword, payload.newPassword).yields(fullError, null);

  tt.plan(1);
  fm.module.changePassword({ state }, payload).catch(
    (err) => {
      tt.deepEqual(err, fullError, 'changePassword should reject with { code, message }');
    },
  );
});
