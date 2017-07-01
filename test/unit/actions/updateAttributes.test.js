import test from 'tape';
import * as sinon from 'sinon';

import { createModule } from '../helpers';

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

test('updateAttributes', { timeout: 500 }, (t) => {
  const fm = createModule();

  const promise = fm.module.updateAttributes({ state }, {});

  t.plan(7);

  t.ok('updateAttributes' in fm.module, 'exported actions contain a updateAttributes method');
  t.ok(promise instanceof Promise, 'updateAttributes returns a Promise');

  // User tests
  t.ok(fm.fake.CognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(fm.fake.CognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(fm.fake.CognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(fm.fake.CognitoUserPool),
    Username: state.user.username,
  })), 'CognitoUser constructor should receive { Pool, Username }');

  // Session constructor tests
  t.ok(fm.methods.CognitoUser.getCognitoUserSession.calledOnce, 'CognitoUserSession constructor should be called once');
  t.ok(fm.methods.CognitoUser.getCognitoUserSession.calledWithMatch(sinon.match(state.user.tokens)), 'getCognitoUserSession should receive { Pool, Username }');
});

test('updateAttributes => rejects when state.user is null', (t) => {
  const fm = createModule();

  t.plan(1);

  const fullError = {
    message: 'User is unauthenticated',
  };

  fm.module.updateAttributes({ state: { user: null } }).catch(
    (err) => {
      t.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
    },
  );
});

test('updateAttributes => rejects when state.user.tokens is null', (t) => {
  const fm = createModule();

  t.plan(1);

  const fullError = {
    message: 'User is unauthenticated',
  };

  fm.module.updateAttributes({ state: { user: { tokens: null } } }).catch(
    (err) => {
      t.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
    },
  );
});

test('updateAttributes => success', (t) => {
  const fm = createModule();

  const payload = {
    email: fm.mock.userInfo.attributes[0].Value,
    name: fm.mock.userInfo.attributes[1].Value,
    phone_number: fm.mock.userInfo.attributes[2].Value,
  };

  fm.methods.CognitoUser.updateAttributes.withArgs(payload).yields(null, 'SUCCESS');

  fm.module.updateAttributes({ state }, payload).then(
    () => {
      t.pass('updateAttributes returned promise.resolve() was called');
    },
  );

  t.plan(3);

  t.ok(fm.methods.CognitoUser.updateAttributes.called, 'updateAttributes should be called');
  t.ok(fm.methods.CognitoUser.updateAttributes.calledOnce, 'updateAttributes should be called once');

  t.deepEqual(fm.methods.CognitoUser.updateAttributes.firstCall.args[0], fm.mock.userInfo.attributes,
    'cognitoUserPool.updateAttributes first argument should be list of attributes');
});

test('updateAttributes => failure', (t) => {
  const fm = createModule();

  const payload = {
    email: fm.mock.userInfo.attributes[0].Value,
    name: fm.mock.userInfo.attributes[1].Value,
    phone_number: fm.mock.userInfo.attributes[2].Value,
  };

  const errorMessage = 'Something went wrong';

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  fm.methods.CognitoUser.updateAttributes.yields(fullError, null);

  t.plan(1);
  fm.module.updateAttributes({ state }, payload).catch(
    (err) => {
      t.deepEqual(err, fullError, 'updateAttributes should reject with { code, message }');
    },
  );
});

test('updateAttributes => reject', (t) => {
  const fm = createModule();

  state.user = null;

  const error = {
    message: 'User is unauthenticated',
  };

  fm.module.signOut({ state }).catch(
    (err) => {
      t.deepEqual(err, error, 'updateAttributes should reject if the user is unauthenticated');
    },
  );

  t.plan(1);
});
