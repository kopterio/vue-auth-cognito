import test from 'tape';
import * as sinon from 'sinon';

import { createModule } from '../helpers';

const payload = {
  username: 'test',
};

test('forgotPassword', { timeout: 500 }, (t) => {
  const fm = createModule();

  const promise = fm.module.forgotPassword({ commit: fm.fake.commit }, payload);

  t.plan(5);

  t.ok('forgotPassword' in fm.module, 'exported actions contain a forgotPassword method');

  t.ok(promise instanceof Promise, 'forgotPassword returns a Promise');
  t.ok(fm.fake.CognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(fm.fake.CognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(fm.fake.CognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(fm.fake.CognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor first argument is { Pool, Username }');
});

test('forgotPassword => onSuccess', (t) => {
  const fm = createModule({
    forgotPassword: (callbacks) => {
      callbacks.onSuccess();
    },
  });

  fm.module.forgotPassword({ }, payload).then(
    () => {
      t.pass('forgotPassword returned promise.resolve() was called');
    },
  );

  t.plan(3);

  t.ok(fm.methods.CognitoUser.forgotPassword.called, 'forgotPassword should be called');
  t.ok(fm.methods.CognitoUser.forgotPassword.calledOnce, 'forgotPassword should be called once');
});

test('forgotPassword => onFailure', { timeout: 500 }, (t) => {
  const errorMessage = 'Wrong confirmation code';

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  const fm = createModule({
    forgotPassword: (callbacks) => {
      callbacks.onFailure(fullError);
    },
  });

  fm.methods.CognitoUser.forgotPassword =
  sinon.spy();

  t.plan(1);

  fm.module.forgotPassword({ }, payload).catch(
    (err) => {
      t.deepEqual(err, fullError, 'forgotPassword should reject with { code, message }');
    },
  );
});
