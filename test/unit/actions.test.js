import test from 'tape';
import proxyquire from 'proxyquire';
import * as sinon from 'sinon';

import * as types from '../../lib/mutation-types';

const fakeCognitoConfig = {
  Region: 'us-east-1',
  UserPoolId: 'us-east-1_xxxxxxxxx',
  ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
  IdentityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

// fixture for user details
const userInfo = {
  username: 'test',
  password: 'Qwerty123!',
  email: 'test@test.com',
  name: 'MegaTest',
  phone_number: '+15553334444',
};

test('cognito signUp', (t) => {
  const FakeCognitoUserPool = sinon.stub();
  const cSignUp = FakeCognitoUserPool.prototype.signUp = sinon.stub();

  const actions = proxyquire('../../lib/actions', {
    'amazon-cognito-identity-js/src/CognitoUserPool': { default: FakeCognitoUserPool },
  }).default(fakeCognitoConfig); // call the default exported function with config

  t.plan(3);
  t.assert('signUp' in actions, 'exported actions contain a signUp method');

  t.test('successful signup', (tt) => {
    const commitSpy = sinon.spy();

    // set CognitoUserPool.signUp to call the callback with err:null,data:stuff
    cSignUp.withArgs(userInfo.username, userInfo.password).yields(null, {
      user: { username: userInfo.username },
      userConfirmed: false,
    });

    // call the signUp action as if it is called by vuex
    actions.signUp({ commit: commitSpy }, userInfo);

    tt.plan(6);

    tt.ok(cSignUp.called, 'cognitoUserPool.signUp should be called');
    tt.ok(cSignUp.calledOnce, 'cognitoUserPool.signUp should be called exactly once');
    tt.ok(cSignUp.calledWith(userInfo.username, userInfo.password),
      'cognitoUserPool.signUp first two arguments should be username and password');

    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.SIGNUP),
      sinon.match({
        username: userInfo.username,
        confirmed: false,
      })), `mutation '${types.SIGNUP}' should receive payload: {username, confirmed}`);

    tt.end();
  });

  t.test('failed signup', (tt) => {
    const commitSpy = sinon.spy();

    const errorMessage = 'Incorrect username or password';

    // set CognitoUserPool.signUp to call the callback with an error!
    cSignUp.withArgs('gooduser', 'wrongpassword').yields({
      code: 'NotAuthorizedException',
      message: errorMessage,
      name: 'NotAuthorizedException',
      retryDelay: 59.43,
    }, null);

    // call the signUp action as if it is called by vuex
    actions.signUp({ commit: commitSpy }, Object.assign(
      userInfo, { username: 'gooduser', password: 'wrongpassword' }
    ));

    tt.plan(3);
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.SIGNUP_FAILURE),
      sinon.match.hasOwn('errorMessage', errorMessage)
    ), `mutation '${types.SIGNUP_FAILURE}' should receive payload: { errorMessage: '...' }`);

    tt.end();
  });

  t.end();
});

test('cognito confirmRegistration', (t) => {
  // sinon.log = msg => t.comment(msg);
  const FakeCognitoUser = sinon.stub();
  const cConfirm = FakeCognitoUser.prototype.confirmRegistration = sinon.stub();
  FakeCognitoUser.prototype.makeUnauthenticatedRequest = sinon.stub();
  // const FakeCognitoUserNamespace = { default() {} };
  // const CognitoUserContructor = sinon.stub(FakeCognitoUserNamespace, 'default');


  // CognitoUserContructor.returns(FakeCognitoUser);

  const FakeCognitoUserPool = sinon.stub();

  const actions = proxyquire('../../lib/actions', {
    'amazon-cognito-identity-js/src/CognitoUserPool': {
      default: FakeCognitoUserPool,
    },
    'amazon-cognito-identity-js/src/CognitoUser': FakeCognitoUser,
  }).default(fakeCognitoConfig); // call the default exported function with config

  // console.log()

  const payload = {
    username: 'test',
    code: '123456',
  };

  const commitSpy = sinon.spy();

  cConfirm.withArgs(payload.code).yields(null, 'SUCCESS');

  actions.confirmRegistration({ commit: commitSpy }, payload);

  t.plan(1);

  t.ok(FakeCognitoUser.called);

  t.end();

  // t.plan(3);
  // t.assert('signUp' in actions, 'exported actions contain a signUp method');
});
