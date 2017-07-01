import test from 'tape';
import * as sinon from 'sinon';

import { createModule } from '../helpers';

import * as types from '../../../src/mutation-types';

test('signOut', { timeout: 500 }, (t) => {
  const fm = createModule();

  const state = {
    user: fm.fake.CognitoUser.prototype,
  };

  const promise = fm.module.signOut({ commit: fm.fake.commit, state });

  t.plan(2);

  t.ok('signOut' in fm.module, 'exported actions contain a signOut method');
  t.ok(promise instanceof Promise, 'signOut returns a Promise');
});

test('signOut => success', (t) => {
  const fm = createModule();

  const state = {
    user: fm.fake.CognitoUser.prototype,
  };

  fm.module.signOut({ commit: fm.fake.commit, state }).then(
    () => {
      t.pass('signOut returned promise.resolve() was called');
    },
  );

  t.plan(6);

  t.ok(fm.methods.CognitoUser.signOut.called, 'signOut should be called');
  t.ok(fm.methods.CognitoUser.signOut.calledOnce, 'signOut should be called once');

  t.ok(fm.fake.commit.called, 'state.commit should be called');
  t.ok(fm.fake.commit.calledOnce, 'state.commit should be called exactly once');
  t.ok(fm.fake.commit.calledWithMatch(
    sinon.match(types.SIGNOUT),
  ), `mutation ${types.SIGNOUT} should be commited`);
});

test('signOut => reject', (t) => {
  const fm = createModule();

  const state = {
    user: null,
  };

  const error = {
    message: 'User is unauthenticated',
  };

  t.plan(1);
  fm.module.signOut({ commit: fm.fake.commit, state }).catch(
    (err) => {
      t.deepEqual(err, error, 'signOut should reject if the user is unauthenticated');
    },
  );
});
