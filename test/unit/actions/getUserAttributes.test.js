import test from 'tape';
import * as sinon from 'sinon';

import { createModule } from '../helpers';

import * as types from '../../../src/mutation-types';

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

test('getUserAttributes', { timeout: 500 }, (t) => {
  const fm = createModule();

  const promise = fm.module.getUserAttributes({ state });

  t.plan(7);

  t.ok('getUserAttributes' in fm.module, 'exported actions contain a getUserAttributes method');
  t.ok(promise instanceof Promise, 'getUserAttributes returns a Promise');

  // User tests
  t.ok(fm.fake.CognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(fm.fake.CognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(fm.fake.CognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(fm.fake.CognitoUserPool),
    Username: state.user.username,
  })), 'CognitoUser constructor should receive { Pool, Username }');

  // Session constructor tests
  t.ok(fm.methods.CognitoUser.getCognitoUserSession.calledOnce, 'getCognitoUserSession constructor should be called once');
  t.ok(fm.methods.CognitoUser.getCognitoUserSession.calledWithMatch(sinon.match(state.user.tokens)), 'getCognitoUserSession should receive { Pool, Username }');
});

test('getUserAttributes => rejects when state.user is null', (t) => {
  const fm = createModule();

  t.plan(1);

  const fullError = {
    message: 'User is unauthenticated',
  };

  fm.module.getUserAttributes({ state: { user: null } }).catch(
    (err) => {
      t.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
    },
  );
});

test('getUserAttributes => rejects when state.user.tokens is null', (t) => {
  const fm = createModule();

  t.plan(1);

  const fullError = {
    message: 'User is unauthenticated',
  };

  fm.module.getUserAttributes({ state: { user: { tokens: null } } }).catch(
    (err) => {
      t.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
    },
  );
});

test('getUserAttributes => success', (t) => {
  const fm = createModule();

  const cognitoAttributes = [
    { Name: 'email', Value: 'test@test.com' },
  ];

  fm.methods.CognitoUser.getUserAttributes.yields(null, cognitoAttributes);

  fm.module.getUserAttributes({ commit: fm.fake.commit, state }).then(
    () => {
      t.pass('getUserAttributes returned promise.resolve() was called');
    },
  );

  t.plan(6);

  t.ok(fm.methods.CognitoUser.getUserAttributes.called, 'updateAttributes should be called');
  t.ok(fm.methods.CognitoUser.getUserAttributes.calledOnce, 'updateAttributes should be called once');
  t.ok(fm.fake.commit.called, 'state.commit should be called');
  t.ok(fm.fake.commit.calledOnce, 'state.commit should be called exactly once');
  t.ok(fm.fake.commit.calledWithMatch(
    sinon.match(types.ATTRIBUTES),
    sinon.match({
      email: 'test@test.com',
    }),
  ), `mutation ${types.ATTRIBUTES} should receive attributes map payload`);
});

test('getUserAttributes => failure', (t) => {
  const fm = createModule();

  const errorMessage = 'Something went wrong';

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  fm.methods.CognitoUser.getUserAttributes.yields(fullError, null);

  t.plan(1);
  fm.module.getUserAttributes({ state }).catch(
    (err) => {
      t.deepEqual(err, fullError, 'getUserAttributes should reject with { code, message }');
    },
  );
});
