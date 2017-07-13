import test from 'tape';
import * as sinon from 'sinon';

import { createModule } from '../helpers';

import * as types from '../../../src/mutation-types';

test('signUp', (t) => {
  const fm = createModule();

  const promise = fm.module.signUp({}, fm.mock.userInfo);

  t.plan(2);

  t.ok('signUp' in fm.module, 'exported actions contain a signUp method');
  t.ok(promise instanceof Promise, 'signUp returns a Promise');
});

test('signUp => onSuccess', (t) => {
  const fm = createModule();

  const cognitoUser = {
    getUsername: sinon.stub().returns('testusername'),
  };

  const attributes = {
    email: fm.mock.userInfo.attributes[0].Value,
    name: fm.mock.userInfo.attributes[1].Value,
    phone_number: fm.mock.userInfo.attributes[2].Value,
  };

  // set CognitoUserPool.signUp to call the callback with err:null,data:stuff
  fm.methods.CognitoUserPool.signUp.withArgs(fm.mock.userInfo.username, fm.mock.userInfo.password).yields(null, {
    user: cognitoUser,
    userConfirmed: false,
  });

  // call the signUp action as if it is called by vuex
  fm.module.signUp({ commit: fm.fake.commit },
    {
      ...fm.mock.userInfo,
      attributes,
    }).then(
    ({ userConfirmationNecessary }) => {
      t.ok(userConfirmationNecessary, true, 'userConfirmationNecessary should be passed to resolve');
    },
  );

  t.plan(9);

  t.ok(fm.methods.CognitoUserPool.signUp.called, 'cognitoUserPool.signUp should be called');
  t.ok(fm.methods.CognitoUserPool.signUp.calledOnce, 'cognitoUserPool.signUp should be called exactly once');
  t.deepEqual(fm.methods.CognitoUserPool.signUp.firstCall.args[0],
    fm.mock.userInfo.username,
    'cognitoUserPool.signUp first two arguments should be username and password');
  t.deepEqual(fm.methods.CognitoUserPool.signUp.firstCall.args[1],
    fm.mock.userInfo.password,
    'cognitoUserPool.signUp first two arguments should be username and password');
  t.deepEqual(fm.methods.CognitoUserPool.signUp.firstCall.args[2],
    fm.mock.userInfo.attributes,
    'cognitoUserPool.signUp first two arguments should be username and password');

  t.ok(fm.fake.commit.called, 'state.commit should be called');
  t.ok(fm.fake.commit.calledOnce, 'state.commit should be called exactly once');
  t.ok(fm.fake.commit.calledWithMatch(
    sinon.match(types.AUTHENTICATE),
    sinon.match({
      username: 'testusername',
      tokens: null,
      attributes: {},
    }),
  ), `mutation ${types.AUTHENTICATE} should receive user payload`);
});

test('signUp => onFailure', (t) => {
  const fm = createModule();

  fm.methods.CognitoUserPool.signUp.reset();

  const errorMessage = 'Something went wrong here';

  const fullError = {
    code: 'NotAuthorizedException',
    message: errorMessage,
  };

  fm.methods.CognitoUserPool.signUp.withArgs(fm.mock.userInfo.username, fm.mock.userInfo.password).yields(fullError, null);

  t.plan(1);

  fm.module.signUp({ commit: fm.fake.commit }, fm.mock.userInfo).catch(
    (err) => {
      t.deepEqual(err, fullError, 'signUp should reject with { code, message }');
    },
  );
});
