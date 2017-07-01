import test from 'tape';
import * as sinon from 'sinon';

import { createModule, createSessionStub } from '../helpers';

import * as types from '../../../src/mutation-types';

// Tests
test('getCurrentUser => reject when user is null', { timeout: 500 }, (t) => {
  const fm = createModule();

  t.plan(3);

  fm.methods.CognitoUserPool.getCurrentUser.returns(null);

  const fullError = {
    message: "Can't retrieve the current user",
  };

  t.plan(3);

  // call the signUp action as if it is called by vuex
  const promise = fm.module.getCurrentUser({ commit: fm.fake.commit }).catch(
    (err) => {
      t.deepEqual(err, fullError, 'signUp should reject with { code, message }');
    },
  );
  t.ok('getCurrentUser' in fm.module, 'exported actions contain a getCurrentUser method');
  t.ok(promise instanceof Promise, 'getCurrentUser returns a Promise');
});

test("getCurrentUser => reject when it can't get a session", (t) => {
  const fm = createModule();

  const errorMessage = "Can't retrieve user's session";

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  fm.mock.currentUser.getSession.yields(fullError, null);

  t.plan(1);

  fm.module.getCurrentUser({ commit: fm.fake.commit }).catch((err) => {
    t.deepEqual(err, fullError, 'getCurrentUser should reject with { code, message }');
  });
});

test('getCurrentUser => success', (t) => {
  const fm = createModule();

  const sessionInstance = createSessionStub();

  fm.mock.currentUser.getSession.yields(null, sessionInstance);

  // call the signUp action as if it is called by vuex
  fm.module.getCurrentUser({ commit: fm.fake.commit }).then(() => {
    t.pass('getCurrentUser returned promise.resolve() was called');
  });

  t.plan(10);

  t.ok(fm.mock.currentUser.getSession.called, 'cognitoUser.getSession should be called');
  t.ok(fm.mock.currentUser.getSession.calledOnce, 'cognitoUser.getSession should be called exactly once');
  t.ok(fm.mock.currentUser.getUsername.called, 'cognitoUser.getUsername should be called');

  t.ok(sessionInstance.getIdToken.calledOnce, 'session.getIdToken should be called once');
  t.ok(sessionInstance.getAccessToken.calledOnce, 'session.getAccessToken should be called once');
  t.ok(sessionInstance.getRefreshToken.calledOnce, 'session.getRefreshToken should be called once');

  t.ok(fm.fake.commit.called, 'state.commit should be called');
  t.ok(fm.fake.commit.calledOnce, 'state.commit should be called exactly once');
  t.ok(fm.fake.commit.calledWithMatch(
    sinon.match(types.AUTHENTICATE),
  ), `mutation ${types.AUTHENTICATE} should receive CognitoUser payload`);
});
