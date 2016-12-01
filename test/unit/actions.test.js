import test from 'tape';
import proxyquire from 'proxyquire';
import * as sinon from 'sinon';

import store from '../../src/store';

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
    const promise = actions.signUp({ commit: commitSpy }, userInfo);

    tt.plan(7);

    tt.ok(promise instanceof Promise);
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
  // FakeCognitoUser.prototype.makeUnauthenticatedRequest = sinon.stub();
  // const FakeCognitoUserNamespace = { default() {} };
  // const CognitoUserContructor = sinon.stub(FakeCognitoUserNamespace, 'default');


  // CognitoUserContructor.returns(FakeCognitoUser);

  const FakeCognitoUserPool = sinon.stub();

  const actions = proxyquire('../../lib/actions', {
    'amazon-cognito-identity-js/src/CognitoUserPool': {
      default: FakeCognitoUserPool,
    },
    'amazon-cognito-identity-js/src/CognitoUser': {
      default: FakeCognitoUser,
    },
  }).default(fakeCognitoConfig); // call the default exported function with config

  // console.log()

  const payload = {
    username: 'test',
    code: '123456',
  };

  const errorMessage = 'Wrong confirmation code';

  // const commitSpy = sinon.spy();

  const promise = actions.confirmRegistration({ }, payload);

  t.plan(6);

  t.ok(promise instanceof Promise);
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(
    sinon.match({
      Pool: sinon.match.instanceOf(FakeCognitoUserPool),
      Username: payload.username,
    })
  ), 'CognitoUser constructor first argument should have `Pool` property');
  // t.ok(FakeCognitoUser.calledWithMatch(
  //   sinon.match.hasOwn('Username', payload.username)
  // ), 'CognitoUser constructor first argument should have `Username` property');

  t.test('success', (tt) => {
    const commitSpy = sinon.spy();
    cConfirm.reset();

    cConfirm.withArgs(payload.code).yields(null, 'SUCCESS');

    actions.confirmRegistration({ commit: commitSpy }, payload);

    tt.plan(5);

    tt.ok(cConfirm.called);
    tt.ok(cConfirm.calledOnce);
    tt.ok(cConfirm.calledWithMatch(
      sinon.match(payload.code)
    ));

    tt.ok(commitSpy.called);

    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.CONFIRMED)
    ));

    tt.end();
  });

  t.test('failure', (tt) => {
    const commitSpy = sinon.spy();

    cConfirm.withArgs(`${payload.code}1`).yields({
      code: 'NotAuthorizedException',
      message: errorMessage,
      name: 'NotAuthorizedException',
      retryDelay: 59.43,
    }, null);

    actions.confirmRegistration({ commit: commitSpy }, Object.assign(payload, { code: `${payload.code}1` }));

    tt.plan(1);

    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.CONFIRMED_FAILURE),
      sinon.match.hasOwn('errorMessage', errorMessage)
    ), `mutation '${types.CONFIRMED_FAILURE}' should receive payload: { errorMessage: '...' }`);

    tt.comment(commitSpy.args);

    tt.end();
  });

  t.end();
});

test('cognito authenticate', (t) => {
  // Fake User
  const FakeCognitoUser = sinon.stub();
  FakeCognitoUser.prototype.authenticateUser = sinon.stub();

  // Fake Pool
  const FakeCognitoUserPool = sinon.stub();

  // Fake AuthenticationDetails
  const FakeAuthenticationDetails = sinon.stub();

  const actions = proxyquire('../../lib/actions', {
    'amazon-cognito-identity-js/src/CognitoUserPool': {
      default: FakeCognitoUserPool,
    },
    'amazon-cognito-identity-js/src/AuthenticationDetails': {
      default: FakeAuthenticationDetails,
    },
    'amazon-cognito-identity-js/src/CognitoUser': {
      default: FakeCognitoUser,
    },
  }).default(fakeCognitoConfig); // call the default exported function with config

  const payload = {
    username: 'test',
    password: 'Qwerty123!',
  };

  const errorMessage = 'Wrong username or password';

  const promise = actions.authenticateUser({ }, payload);

  t.plan(8);

  t.ok(promise instanceof Promise);
  // AuthenticationDetails test
  t.ok(FakeAuthenticationDetails.called, 'AuthenticationDetails constructor should be called');
  t.ok(FakeAuthenticationDetails.calledOnce, 'AuthenticationDetails constructor should be called once');
  t.ok(FakeAuthenticationDetails.calledWithMatch(
    sinon.match({
      Username: payload.username,
      Password: payload.password,
    })
  ), "AuthenticationDetails constructor's first argument should have { Username, Password } properties");

  // User tests
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(
    sinon.match({
      Username: payload.username,
    })
  ), 'CognitoUser constructor first argument should have `Pool` property');
  // t.ok(FakeCognitoUser.calledWithMatch(
  //   sinon.match.hasOwn('Username', payload.username)
  // ), 'CognitoUser constructor first argument should have `Username` property');

  t.test('onFailure', (tt) => {
    const commitSpy = sinon.spy();
    const cAuth = FakeCognitoUser.prototype.authenticateUser =
    sinon.spy((authDetails, callbacks) => {
      callbacks.onFailure({
        code: 'NotAuthorizedException',
        message: errorMessage,
      });
    });

    actions.authenticateUser({ commit: commitSpy }, payload);
    // TODO: check for Promise
    // .catch(() => {
    //   tt.ok(true);
    // });

    tt.plan(5);

    tt.ok(cAuth.called, 'cognitoUser.authenticateUser should be called');
    tt.ok(cAuth.calledOnce, 'cognitoUser.authenticateUser should be called once');
    tt.ok(cAuth.calledWithMatch(
      sinon.match.instanceOf(FakeAuthenticationDetails)
    ), "cognitoUser.authenticateUser's first argument should be AuthenticationDetails");

    tt.ok(commitSpy.called, 'commit should be called');

    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.AUTHENTICATE_FAILURE)
    ), `mutation ${types.AUTHENTICATE_FAILURE} should receive { errorMessage: ... } payload`);

    tt.end();
  });

  t.end();
});
