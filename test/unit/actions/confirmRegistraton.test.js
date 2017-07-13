import test from 'tape';
import * as sinon from 'sinon';

import { createModule } from '../helpers';

const payload = {
  username: 'test',
  code: '123456',
};

test('confirmRegistration', { timeout: 500 }, (t) => {
  const fm = createModule();

  const promise = fm.module.confirmRegistration({ }, payload);

  t.plan(5);

  t.ok('confirmRegistration' in fm.module, 'exported actions contain a confirmRegistration method');

  t.ok(promise instanceof Promise, 'confirmRegistration returns a Promise');
  t.ok(fm.fake.CognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(fm.fake.CognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(fm.fake.CognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(fm.fake.CognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor first argument is { Pool, Username }');
});

test('confirmRegistration => successful confirmRegistration', (tt) => {
  const fm = createModule();

  fm.methods.CognitoUser.confirmRegistration.withArgs(payload.code).yields(null, 'SUCCESS');

  fm.module.confirmRegistration({ commit: fm.fake.commit }, payload).then(
    () => {
      tt.pass('confirmRegistration returned promise.resolve() was called');
    },
  );

  tt.plan(4);
  tt.ok(fm.methods.CognitoUser.confirmRegistration.called, 'confirmRegistration should be called');
  tt.ok(fm.methods.CognitoUser.confirmRegistration.calledOnce, 'confirmRegistration should be called once');
  tt.ok(fm.methods.CognitoUser.confirmRegistration.calledWithMatch(
    sinon.match(payload.code),
  ), 'confirmRegistration should be called with the `code` argument');
});

test('confirmRegistration => failure', (tt) => {
  const fm = createModule();

  const errorMessage = 'Wrong confirmation code';

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  fm.methods.CognitoUser.confirmRegistration.withArgs(`${payload.code}1`).yields(fullError, null);

  tt.plan(1);
  fm.module.confirmRegistration({ commit: fm.fake.commit }, Object.assign(payload, { code: `${payload.code}1` })).catch(
    (err) => {
      tt.deepEqual(err, fullError, 'confirmRegistration should reject with { code, message } object');
    });
});
