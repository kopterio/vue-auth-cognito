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

test('cognito successful signUp', (tt) => {
  const cSignUp = FakeCognitoUserPool.prototype.signUp = sinon.stub();

  tt.plan(8);

  tt.ok('signUp' in actions, 'exported actions contain a signUp method');
    // set CognitoUserPool.signUp to call the callback with err:null,data:stuff
  cSignUp.withArgs(userInfo.username, userInfo.password).yields(null, {
    user: { username: userInfo.username },
    userConfirmed: false,
  });

  // call the signUp action as if it is called by vuex
  const promise = actions.signUp({ commit: commitSpy }, userInfo);

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
  });

  t.test('failure', (tt) => {
    cConfirm.withArgs(`${payload.code}1`).yields({
      code: 'NotAuthorizedException',
      message: errorMessage,
    }, null);

    tt.plan(1);
    actions.confirmRegistration({ commit: commitSpy }, Object.assign(payload, { code: `${payload.code}1` })).catch(
      (err) => {
        tt.deepEqual(err, { code: 'NotAuthorizedException', message: errorMessage }, 'confirmRegistration should reject with { code, message } object');
      });
  });

  t.end();
});

test('cognito authenticateUser', (t) => {
  FakeCognitoUser.reset();
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
    FakeCognitoUser.prototype.authenticateUser =
    sinon.spy((authDetails, callbacks) => {
      callbacks.onFailure({
        code: 'NotAuthorizedException',
        message: errorMessage,
      });
    });

    tt.plan(1);

    actions.authenticateUser({ commit: commitSpy }, payload).catch(
      (catchErrorMessage) => {
        tt.equal(catchErrorMessage, errorMessage, 'authenticateUser should reject with err.message');
      }
    );
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
        user: {
          username: payload.username,
          confirmed: !userConfirmationNecessary,
        },
        tokens: {
          id: {
            jwt: 'fake id token jwt token',
            expiration: 'fake id token expiration',
          },
          access: {
            jwt: 'fake access token jwt token',
            expiration: 'fake access token expiration',
          },
          refresh: {
            jwt: 'fake refresh token value',
          },
        },
      })
    ), `mutation ${types.AUTHENTICATE} should receive payload with details`);

    tt.end();
  });

  t.end();
});

test('cognito confirmPassword', (t) => {
  commitSpy.reset();
  FakeCognitoUser.reset();

  FakeCognitoUser.prototype.confirmPassword =
  sinon.spy((confirmationCode, newPassword, callbacks) => {
    callbacks.onSuccess();
  });

  const payload = {
    username: 'test',
    code: '123456',
    newPassword: 'Qwerty123!',
  };

  const errorMessage = 'Wrong confirmation code';

  const promise = actions.confirmPassword({ }, payload);

  t.plan(6);

  t.ok(promise instanceof Promise, 'confirmRegistration returns a Promise');
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(FakeCognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor first argument is { Pool, Username }');

  t.test('onSuccess', (tt) => {
    commitSpy.reset();

    const cConfirm = FakeCognitoUser.prototype.confirmPassword =
    sinon.spy((confirmationCode, newPassword, callbacks) => {
      callbacks.onSuccess();
    });

    actions.confirmPassword({ commit: commitSpy }, payload);

    tt.plan(5);
    tt.ok(cConfirm.called, 'confirmPassword should be called');
    tt.ok(cConfirm.calledOnce, 'confirmPassword should be called once');
    tt.ok(cConfirm.calledWithMatch(
      sinon.match(payload.code)
    ), 'confirmPassword should be called with the `code` argument');
  });

  t.test('onFailure', (tt) => {
    FakeCognitoUser.prototype.confirmPassword =
    sinon.spy((confirmationCode, newPassword, callbacks) => {
      callbacks.onFailure({
        code: 'NotAuthorizedException',
        message: errorMessage,
      });
    });

    tt.plan(1);
    actions.confirmPassword({ commit: commitSpy }, payload).catch(
      (catchErrorMessage) => {
        tt.equal(catchErrorMessage, errorMessage, 'confirmPassword should reject with err.message');
      }
    );
  });

  t.end();
});
