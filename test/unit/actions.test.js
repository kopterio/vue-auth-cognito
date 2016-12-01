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

const FakeCognitoUser = sinon.stub();
const FakeCognitoUserPool = sinon.stub();
const FakeAuthenticationDetails = sinon.stub();
const actions = proxyquire('../../lib/actions', {
  'amazon-cognito-identity-js/src/CognitoUserPool': { default: FakeCognitoUserPool },
  'amazon-cognito-identity-js/src/CognitoUser': { default: FakeCognitoUser },
  'amazon-cognito-identity-js/src/AuthenticationDetails': { default: FakeAuthenticationDetails },
}).default(fakeCognitoConfig); // call the default exported function with config
const commitSpy = sinon.spy();

test('cognito signUp', (t) => {
  const cSignUp = FakeCognitoUserPool.prototype.signUp = sinon.stub();

  t.plan(3);
  t.assert('signUp' in actions, 'exported actions contain a signUp method');
  t.test('successful signup', (tt) => {
    // set CognitoUserPool.signUp to call the callback with err:null,data:stuff
    cSignUp.withArgs(userInfo.username, userInfo.password).yields(null, {
      user: { username: userInfo.username },
      userConfirmed: false,
    });

    // call the signUp action as if it is called by vuex
    const promise = actions.signUp({ commit: commitSpy }, userInfo);

    tt.plan(7);
    tt.ok(promise instanceof Promise, 'signUp action should return a promise');
    tt.ok(cSignUp.called, 'cognitoUserPool.signUp should be called');
    tt.ok(cSignUp.calledOnce, 'cognitoUserPool.signUp should be called exactly once');
    tt.ok(cSignUp.calledWith(userInfo.username, userInfo.password),
      'cognitoUserPool.signUp first two arguments should be username and password');
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.calledWithMatch(sinon.match(types.SIGNUP), sinon.match({
      username: userInfo.username,
      confirmed: false,
    })), `mutation '${types.SIGNUP}' should receive payload: {username, confirmed}`);
    tt.end();
  });

  t.test('failed signup', (tt) => {
    commitSpy.reset();

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
  const cConfirm = FakeCognitoUser.prototype.confirmRegistration = sinon.stub();

  const payload = {
    username: 'test',
    code: '123456',
  };

  const errorMessage = 'Wrong confirmation code';

  const promise = actions.confirmRegistration({ }, payload);

  t.plan(6);

  t.ok(promise instanceof Promise, 'confirmRegistration returns a Promise');
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(FakeCognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor first argument is { Pool, Username }');

  t.test('successful confirmRegistration', (tt) => {
    cConfirm.reset();

    cConfirm.withArgs(payload.code).yields(null, 'SUCCESS');

    actions.confirmRegistration({ commit: commitSpy }, payload);

    tt.plan(5);
    tt.ok(cConfirm.called, 'confirmRegistration should be called');
    tt.ok(cConfirm.calledOnce, 'confirmRegistration should be called once');
    tt.ok(cConfirm.calledWithMatch(
      sinon.match(payload.code)
    ), 'confirmRegistration should be called with the `code` argument');
    tt.ok(commitSpy.called, 'mutation should be called');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.CONFIRMED)
    ), `mutation of type ${types.CONFIRMED} should be called`);
    tt.end();
  });

  t.test('failure', (tt) => {
    commitSpy.reset();

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
    tt.end();
  });

  t.end();
});

test('cognito authenticate', (t) => {
  FakeCognitoUser.reset()
  FakeCognitoUser.prototype.authenticateUser = sinon.stub();

  const payload = {
    username: 'test',
    password: 'Qwerty123!',
  };

  const errorMessage = 'Wrong username or password';

  const promise = actions.authenticateUser({ }, payload);

  t.plan(9);

  t.ok(promise instanceof Promise, 'actions.authenticateUser should return a Promise');
  // AuthenticationDetails test
  t.ok(FakeAuthenticationDetails.called, 'AuthenticationDetails constructor should be called');
  t.ok(FakeAuthenticationDetails.calledOnce, 'AuthenticationDetails constructor should be called once');
  t.ok(FakeAuthenticationDetails.calledWithMatch(sinon.match({
    Username: payload.username,
    Password: payload.password,
  })), "AuthenticationDetails constructor's first argument should have { Username, Password } properties");

  // User tests
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(FakeCognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor should receive { Pool, Username }');

  t.test('onFailure', (tt) => {
    commitSpy.reset()
    const cAuth = FakeCognitoUser.prototype.authenticateUser =
    sinon.spy((authDetails, callbacks) => {
      callbacks.onFailure({
        code: 'NotAuthorizedException',
        message: errorMessage,
      });
    });

    actions.authenticateUser({ commit: commitSpy }, payload);
    // TODO: check for Promise.reject was called
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

  t.test('onSuccess', (tt) => {
    commitSpy.reset();

    const session = {
      getIdToken: () => ({
        getJwtToken: () => 'fake id token jwt token',
        getExpiration: () => 'fake id token expiration',
      }),
      getRefreshToken: () => ({
        getToken: () => 'fake refresh token value',
      }),
      getAccessToken: () => ({
        getJwtToken: () => 'fake access token jwt token',
        getExpiration: () => 'fake access token expiration',
      }),
    };
    const userConfirmationNecessary = true;

    const cAuth = FakeCognitoUser.prototype.authenticateUser =
      sinon.spy((authDetails, callbacks) => {
        callbacks.onSuccess(session, userConfirmationNecessary);
      });

    actions.authenticateUser({ commit: commitSpy }, payload);
    // TODO: check for Promise.resolve was called

    tt.plan(5);

    // test: payload.idTokenJwt == IdToken().JwtToken()
    // test: payload.idTokenExpiration == IdToken().Expiration()
    tt.ok(cAuth.called, 'cognitoUser.authenticateUser should be called');
    tt.ok(cAuth.calledOnce, 'cognitoUser.authenticateUser should be called once');
    tt.ok(cAuth.calledWithMatch(
      sinon.match.instanceOf(FakeAuthenticationDetails)
    ), "cognitoUser.authenticateUser's first argument should be AuthenticationDetails");

    tt.ok(commitSpy.called, 'commit should be called');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.AUTHENTICATE), sinon.match({
        username: payload.username,
        userConfirmationNecessary,
        idTokenJwt: 'fake id token jwt token',
        idTokenExpiration: 'fake id token expiration',
        accessTokenJwt: 'fake access token jwt token',
        accessTokenExpiration: 'fake access token expiration',
        refreshToken: 'fake refresh token value',
      })
    ), `mutation ${types.AUTHENTICATE} should receive payload with details`);

    tt.end();
  });

  t.end();
});
