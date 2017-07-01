import test from 'tape';
import * as sinon from 'sinon';

import { createModule } from '../helpers';

const payload = {
  username: 'test',
  code: '123456',
  newPassword: 'Qwerty123!',
};

test('confirmPassword', { timeout: 500 }, (t) => {
  const fm = createModule();

  const promise = fm.module.confirmPassword({ commit: fm.fake.commit }, payload);

  t.plan(5);

  t.ok('confirmPassword' in fm.module, 'exported actions contain a confirmPassword method');

  t.ok(promise instanceof Promise, 'confirmRegistration returns a Promise');
  t.ok(fm.fake.CognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(fm.fake.CognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(fm.fake.CognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(fm.fake.CognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor first argument is { Pool, Username }');
});

test('confirmPassword => onSuccess', (tt) => {
  const fm = createModule();

  const cConfirm = fm.fake.CognitoUser.prototype.confirmPassword =
  sinon.spy((confirmationCode, newPassword, callbacks) => {
    callbacks.onSuccess();
  });

  fm.module.confirmPassword({ commit: fm.fake.commit }, payload).then(
    () => {
      tt.pass('confirmPassword returned promise.resolve() was called');
    },
  );

  tt.plan(4);

  tt.ok(cConfirm.called, 'confirmPassword should be called');
  tt.ok(cConfirm.calledOnce, 'confirmPassword should be called once');
  tt.ok(cConfirm.calledWithMatch(
    sinon.match(payload.code),
  ), 'confirmPassword should be called with the `code` argument');
});

test('confirmPassword => onFailure', (tt) => {
  const fm = createModule();

  const errorMessage = 'Wrong confirmation code';

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  // fm.methods.CognitoUser.confirmPassword.callsFake

  fm.fake.CognitoUser.prototype.confirmPassword =
  sinon.spy((confirmationCode, newPassword, callbacks) => {
    callbacks.onFailure(fullError);
  });

  tt.plan(1);

  fm.module.confirmPassword({ commit: fm.fake.commit }, payload).catch(
    (err) => {
      tt.deepEqual(err, fullError, 'confirmPassword should reject with { code, message }');
    },
  );
});
