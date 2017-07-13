import test from 'tape';
import * as sinon from 'sinon';

import { createModule } from '../helpers';

const payload = {
  username: 'test',
};

test('resendConfirmationCode', { timeout: 500 }, (t) => {
  const fm = createModule();

  const promise = fm.module.resendConfirmationCode({ }, payload);

  t.plan(5);

  t.ok('resendConfirmationCode' in fm.module, 'exported actions contain a resendConfirmationCode method');

  t.ok(promise instanceof Promise, 'resendConfirmationCode returns a Promise');
  t.ok(fm.fake.CognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(fm.fake.CognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(fm.fake.CognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(fm.fake.CognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor first argument is { Pool, Username }');
});

test('onSuccess', (tt) => {
  const fm = createModule();

  fm.methods.CognitoUser.resendConfirmationCode.yields(null);

  fm.module.resendConfirmationCode({ commit: fm.fake.commit }, payload).then(
    () => {
      tt.pass('resendConfirmationCode returned promise.resolve() was called');
    },
  );

  tt.plan(3);

  tt.ok(fm.methods.CognitoUser.resendConfirmationCode.called, 'resendConfirmationCode should be called');
  tt.ok(fm.methods.CognitoUser.resendConfirmationCode.calledOnce, 'resendConfirmationCode should be called once');
});

test('onFailure', (tt) => {
  const fm = createModule();

  const errorMessage = 'Wrong confirmation code';

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  fm.methods.CognitoUser.resendConfirmationCode.yields(fullError);

  tt.plan(1);
  fm.module.resendConfirmationCode({ commit: fm.fake.commit }, payload).catch(
    (err) => {
      tt.deepEqual(err, fullError, 'resendConfirmationCode should reject with { code, message }');
    },
  );
});
