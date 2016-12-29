import test from 'tape';
import proxyquire from 'proxyquire';
import * as sinon from 'sinon';

import * as types from '../../src/mutation-types';

import fakeCognitoConfig from './config';

const FakeCognitoUser = sinon.stub();
const FakeCognitoUserPool = sinon.stub();
const FakeAuthenticationDetails = sinon.stub();
const FakeUserAttribute = sinon.stub();
const FakeCognitoUserSession = sinon.stub();
const actions = proxyquire('../../src/actions', {
  'amazon-cognito-identity-js': {
    CognitoUserPool: FakeCognitoUserPool,
    CognitoUser: FakeCognitoUser,
    CognitoUserSession: FakeCognitoUserSession,
    AuthenticationDetails: FakeAuthenticationDetails,
    CognitoUserAttribute: FakeUserAttribute },
}).default(fakeCognitoConfig); // call the default exported function with config
const commitSpy = sinon.spy();

// fixture for user details
const userInfo = {
  username: 'test',
  password: 'Qwerty123!',
  attributes: [
    new FakeUserAttribute({ Name: 'email', Value: 'test@email' }),
    new FakeUserAttribute({ Name: 'name', Value: 'Richard' }),
    new FakeUserAttribute({ Name: 'phone_number', Value: '+1555234567' }),
  ],
};

// Some helpers for tests
const idTokenMethods = { getJwtToken: sinon.stub().returns('id') };
const accessTokenMethods = { getJwtToken: sinon.stub().returns('access') };
const refreshTokenMethods = { getToken: sinon.stub().returns('refresh') };
function createSessionStub() {
  idTokenMethods.getJwtToken.reset();
  accessTokenMethods.getJwtToken.reset();
  refreshTokenMethods.getToken.reset();

  return {
    getIdToken: sinon.stub().returns(idTokenMethods),
    getRefreshToken: sinon.stub().returns(refreshTokenMethods),
    getAccessToken: sinon.stub().returns(accessTokenMethods),
  };
}

// Tests
test('getCurrentUser', { timeout: 500 }, (t) => {
  const cognitoUser = {
    getSession: sinon.stub(),
    getUsername: sinon.stub().returns('testusername'),
  };
  const getCurrentUser = FakeCognitoUserPool.prototype.getCurrentUser = sinon.stub();

  t.plan(3);

  t.test('reject when user is null', (tt) => {
    getCurrentUser.returns(null);

    const fullError = {
      message: "Can't retrieve the current user",
    };

    tt.plan(3);

    // call the signUp action as if it is called by vuex
    const promise = actions.getCurrentUser({ commit: commitSpy }).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'signUp should reject with { code, message }');
      },
    );
    tt.ok('getCurrentUser' in actions, 'exported actions contain a getCurrentUser method');
    tt.ok(promise instanceof Promise, 'getCurrentUser returns a Promise');
  });

  t.test("reject when can't get a session", (tt) => {
    getCurrentUser.reset();
    getCurrentUser.returns(cognitoUser);

    const errorMessage = "Can't retrieve user's session";

    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    cognitoUser.getSession.yields(fullError, null);

    tt.plan(1);

    actions.getCurrentUser({ commit: commitSpy }).catch((err) => {
      tt.deepEqual(err, fullError, 'getCurrentUser should reject with { code, message }');
    });
  });

  t.test('success', (tt) => {
    getCurrentUser.reset();
    getCurrentUser.returns(cognitoUser);
    cognitoUser.getSession.reset();

    const sessionInstance = createSessionStub();
    cognitoUser.getSession.yields(null, sessionInstance);

    // call the signUp action as if it is called by vuex
    actions.getCurrentUser({ commit: commitSpy }).then(() => {
      tt.pass('getCurrentUser returned promise.resolve() was called');
    });

    tt.plan(10);

    tt.ok(cognitoUser.getSession.called, 'cognitoUser.getSession should be called');
    tt.ok(cognitoUser.getSession.calledOnce, 'cognitoUser.getSession should be called exactly once');
    tt.ok(cognitoUser.getUsername.called, 'cognitoUser.getUsername should be called');
    tt.ok(sessionInstance.getIdToken.calledOnce, 'session.getIdToken should be called once');
    tt.ok(sessionInstance.getAccessToken.calledOnce, 'session.getAccessToken should be called once');
    tt.ok(sessionInstance.getRefreshToken.calledOnce, 'session.getRefreshToken should be called once');
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.AUTHENTICATE),
    ), `mutation ${types.AUTHENTICATE} should receive CognitoUser payload`);
  });
});

test('authenticateUser', { timeout: 500 }, (t) => {
  FakeCognitoUser.reset();
  FakeCognitoUser.prototype.authenticateUser = sinon.stub();

  const payload = {
    username: 'test',
    password: 'Qwerty123!',
  };

  const errorMessage = 'Wrong username or password';

  const promise = actions.authenticateUser({ }, payload);

  t.plan(10);

  t.ok('authenticateUser' in actions, 'exported actions contain a authenticateUser method');

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
    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    FakeCognitoUser.prototype.authenticateUser =
    sinon.spy((authDetails, callbacks) => {
      callbacks.onFailure(fullError);
    });

    tt.plan(1);

    actions.authenticateUser({ commit: commitSpy }, payload).catch((err) => {
      tt.deepEqual(err, fullError, 'authenticateUser should reject with { code, message }');
    });
  });

  t.test('onSuccess', (tt) => {
    commitSpy.reset();

    const sessionInstance = createSessionStub();

    FakeCognitoUser.prototype.getUsername = sinon.stub().returns(payload.username);

    const authenticateUser = FakeCognitoUser.prototype.authenticateUser =
      sinon.spy((authDetails, callbacks) => {
        callbacks.onSuccess(sessionInstance, true);
      });

    actions.authenticateUser({ commit: commitSpy }, payload).then(
      ({ userConfirmationNecessary }) => {
        tt.ok(userConfirmationNecessary, true, 'userConfirmationNecessary should be passed to resolve');
      },
    );

    tt.plan(6);

    tt.ok(authenticateUser.called, 'cognitoUser.authenticateUser should be called');
    tt.ok(authenticateUser.calledOnce, 'cognitoUser.authenticateUser should be called once');
    tt.ok(authenticateUser.calledWithMatch(
      sinon.match.instanceOf(FakeAuthenticationDetails),
    ), "cognitoUser.authenticateUser's first argument should be AuthenticationDetails");

    tt.ok(commitSpy.called, 'commit should be called');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.AUTHENTICATE),
      sinon.match({
        username: payload.username,
        tokens: {
          IdToken: 'id',
          AccessToken: 'access',
          RefreshToken: 'refresh',
        },
        attributes: {},
      }),
    ), `mutation ${types.AUTHENTICATE} should receive user payload`);
  });
});

test('signUp', { timeout: 500 }, (t) => {
  const cognitoUser = {
    getUsername: sinon.stub().returns('testusername'),
  };
  const signUp = FakeCognitoUserPool.prototype.signUp = sinon.stub();

  const promise = actions.signUp({ }, userInfo);

  t.plan(4);

  t.ok('signUp' in actions, 'exported actions contain a signUp method');
  t.ok(promise instanceof Promise, 'signUp returns a Promise');

  t.test('onSuccess', (tt) => {
    commitSpy.reset();
    signUp.reset();

    // set CognitoUserPool.signUp to call the callback with err:null,data:stuff
    signUp.withArgs(userInfo.username, userInfo.password).yields(null, {
      user: cognitoUser,
      userConfirmed: false,
    });

    // call the signUp action as if it is called by vuex
    actions.signUp({ commit: commitSpy }, userInfo).then(
      ({ userConfirmationNecessary }) => {
        tt.ok(userConfirmationNecessary, true, 'userConfirmationNecessary should be passed to resolve');
      },
    );

    tt.plan(7);

    tt.ok(signUp.called, 'cognitoUserPool.signUp should be called');
    tt.ok(signUp.calledOnce, 'cognitoUserPool.signUp should be called exactly once');
    tt.ok(signUp.calledWith(userInfo.username, userInfo.password, userInfo.attributes),
      'cognitoUserPool.signUp first two arguments should be username and password');
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.AUTHENTICATE),
      sinon.match({
        username: 'testusername',
        tokens: null,
        attributes: {},
      }),
    ), `mutation ${types.AUTHENTICATE} should receive user payload`);
  });

  t.test('onFailure', (tt) => {
    signUp.reset();

    const errorMessage = 'Something went wrong here';

    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    signUp.withArgs(userInfo.username, userInfo.password).yields(fullError, null);

    tt.plan(1);

    actions.signUp({ commit: commitSpy }, userInfo).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'signUp should reject with { code, message }');
      },
    );
  });
});

test('confirmRegistration', { timeout: 500 }, (t) => {
  FakeCognitoUser.reset();

  const cConfirm = FakeCognitoUser.prototype.confirmRegistration = sinon.stub();

  const payload = {
    username: 'test',
    code: '123456',
  };

  const errorMessage = 'Wrong confirmation code';

  const promise = actions.confirmRegistration({ }, payload);

  t.plan(7);

  t.ok('confirmRegistration' in actions, 'exported actions contain a confirmRegistration method');

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

    actions.confirmRegistration({ commit: commitSpy }, payload).then(
      () => {
        tt.pass('confirmRegistration returned promise.resolve() was called');
      },
    );

    tt.plan(4);
    tt.ok(cConfirm.called, 'confirmRegistration should be called');
    tt.ok(cConfirm.calledOnce, 'confirmRegistration should be called once');
    tt.ok(cConfirm.calledWithMatch(
      sinon.match(payload.code),
    ), 'confirmRegistration should be called with the `code` argument');
  });

  t.test('failure', (tt) => {
    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    cConfirm.withArgs(`${payload.code}1`).yields(fullError, null);

    tt.plan(1);
    actions.confirmRegistration({ commit: commitSpy }, Object.assign(payload, { code: `${payload.code}1` })).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'confirmRegistration should reject with { code, message } object');
      });
  });
});

test('forgotPassword', { timeout: 500 }, (t) => {
  FakeCognitoUser.reset();

  FakeCognitoUser.prototype.forgotPassword =
  sinon.spy((callbacks) => {
    callbacks.onSuccess();
  });

  const payload = {
    username: 'test',
  };

  const errorMessage = 'Wrong confirmation code';

  const promise = actions.forgotPassword({ commit: commitSpy }, payload);

  t.plan(7);

  t.ok('forgotPassword' in actions, 'exported actions contain a forgotPassword method');

  t.ok(promise instanceof Promise, 'forgotPassword returns a Promise');
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(FakeCognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor first argument is { Pool, Username }');

  t.test('onSuccess', (tt) => {
    const cConfirm = FakeCognitoUser.prototype.forgotPassword =
    sinon.spy((callbacks) => {
      callbacks.onSuccess();
    });

    actions.forgotPassword({ }, payload).then(
      () => {
        tt.pass('forgotPassword returned promise.resolve() was called');
      },
    );

    tt.plan(3);

    tt.ok(cConfirm.called, 'forgotPassword should be called');
    tt.ok(cConfirm.calledOnce, 'forgotPassword should be called once');
  });

  t.test('onFailure', (tt) => {
    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    FakeCognitoUser.prototype.forgotPassword =
    sinon.spy((callbacks) => {
      callbacks.onFailure(fullError);
    });

    tt.plan(1);
    actions.forgotPassword({ }, payload).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'forgotPassword should reject with { code, message }');
      },
    );
  });
});

test('confirmPassword', { timeout: 500 }, (t) => {
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

  const promise = actions.confirmPassword({ commit: commitSpy }, payload);

  t.plan(7);

  t.ok('confirmPassword' in actions, 'exported actions contain a confirmPassword method');

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

    actions.confirmPassword({ commit: commitSpy }, payload).then(
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

  t.test('onFailure', (tt) => {
    commitSpy.reset();

    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    FakeCognitoUser.prototype.confirmPassword =
    sinon.spy((confirmationCode, newPassword, callbacks) => {
      callbacks.onFailure(fullError);
    });

    tt.plan(1);
    actions.confirmPassword({ commit: commitSpy }, payload).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'confirmPassword should reject with { code, message }');
      },
    );
  });
});

test('resendConfirmationCode', { timeout: 500 }, (t) => {
  commitSpy.reset();
  FakeCognitoUser.reset();

  const cResend = FakeCognitoUser.prototype.resendConfirmationCode = sinon.stub();

  const payload = {
    username: 'test',
  };

  const errorMessage = 'Wrong confirmation code';

  const promise = actions.resendConfirmationCode({ }, payload);
  t.plan(7);

  t.ok('resendConfirmationCode' in actions, 'exported actions contain a resendConfirmationCode method');

  t.ok(promise instanceof Promise, 'resendConfirmationCode returns a Promise');
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(FakeCognitoUserPool),
    Username: payload.username,
  })), 'CognitoUser constructor first argument is { Pool, Username }');

  t.test('onSuccess', (tt) => {
    commitSpy.reset();
    cResend.reset();

    cResend.yields(null);

    actions.resendConfirmationCode({ commit: commitSpy }, payload).then(
      () => {
        tt.pass('resendConfirmationCode returned promise.resolve() was called');
      },
    );

    tt.plan(3);

    tt.ok(cResend.called, 'resendConfirmationCode should be called');
    tt.ok(cResend.calledOnce, 'resendConfirmationCode should be called once');
  });

  t.test('onFailure', (tt) => {
    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    cResend.yields(fullError);

    tt.plan(1);
    actions.resendConfirmationCode({ commit: commitSpy }, payload).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'resendConfirmationCode should reject with { code, message }');
      },
    );
  });
});

test('changePassword', { timeout: 500 }, (t) => {
  FakeCognitoUser.reset();
  FakeCognitoUserSession.reset();

  const cChange = FakeCognitoUser.prototype.changePassword = sinon.stub();

  const payload = {
    oldPassword: 'test',
    newPassword: 'test1',
  };

  const state = {
    user: {
      username: 'test',
      tokens: {
        IdToken: 'id',
        AccessToken: 'access',
        RefreshToken: 'refresh',
      },
    },
  };

  const errorMessage = 'Something went wrong';

  const promise = actions.changePassword({ state }, payload);

  t.plan(12);

  t.ok('changePassword' in actions, 'exported actions contain a changePassword method');
  t.ok(promise instanceof Promise, 'changePassword returns a Promise');

  // User tests
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(FakeCognitoUserPool),
    Username: state.user.username,
  })), 'CognitoUser constructor should receive { Pool, Username }');

  // Session constructor tests
  t.ok(FakeCognitoUserSession.called, 'CognitoUserSession constructor should be called');
  t.ok(FakeCognitoUserSession.calledOnce, 'CognitoUserSession constructor should be called once');
  t.ok(FakeCognitoUserSession.calledWithMatch(sinon.match(state.user.tokens)), 'CognitoUser constructor should receive { Pool, Username }');

  t.test('rejects when state.user is null', (tt) => {
    tt.plan(1);

    const fullError = {
      message: 'User is unauthenticated',
    };

    actions.changePassword({ state: { user: null } }).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
      },
    );
  });

  t.test('rejects when state.user.tokens is null', (tt) => {
    tt.plan(1);

    const fullError = {
      message: 'User is unauthenticated',
    };

    actions.changePassword({ state: { user: { tokens: null } } }).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
      },
    );
  });

  t.test('success', (tt) => {
    cChange.reset();

    cChange.withArgs(payload.oldPassword, payload.newPassword).yields(null, 'SUCCESS');

    actions.changePassword({ state }, payload).then(
      () => {
        tt.pass('changePassword returned promise.resolve() was called');
      },
    );

    tt.plan(4);

    tt.ok(cChange.called, 'changePassword should be called');
    tt.ok(cChange.calledOnce, 'changePassword should be called once');
    tt.ok(cChange.calledWith(payload.oldPassword, payload.newPassword),
      'cognitoUser.changePassword first two arguments should be oldPassword and newPassword');
  });

  t.test('failure', (tt) => {
    cChange.reset();

    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    cChange.withArgs(payload.oldPassword, payload.newPassword).yields(fullError, null);

    tt.plan(1);
    actions.changePassword({ state }, payload).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'changePassword should reject with { code, message }');
      },
    );
  });
});

test('updateAttributes', { timeout: 500 }, (t) => {
  FakeCognitoUser.reset();
  FakeCognitoUserSession.reset();

  const updateAttributes = FakeCognitoUser.prototype.updateAttributes = sinon.stub();

  const payload = {
    email: userInfo.email,
    name: userInfo.name,
    phone_number: userInfo.phone_number,
  };

  const attributes = Object.keys(payload || {}).map(key => new FakeUserAttribute({
    Name: key,
    Value: payload[key],
  }));

  const state = {
    user: {
      username: 'test',
      tokens: {
        IdToken: 'id',
        AccessToken: 'access',
        RefreshToken: 'refresh',
      },
    },
  };

  const errorMessage = 'Something went wrong';

  updateAttributes.withArgs(attributes).yields(null);

  const promise = actions.updateAttributes({ state }, payload);

  t.plan(13);

  t.ok('updateAttributes' in actions, 'exported actions contain a updateAttributes method');
  t.ok(promise instanceof Promise, 'updateAttributes returns a Promise');

  // User tests
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(FakeCognitoUserPool),
    Username: state.user.username,
  })), 'CognitoUser constructor should receive { Pool, Username }');

  // Session constructor tests
  t.ok(FakeCognitoUserSession.called, 'CognitoUserSession constructor should be called');
  t.ok(FakeCognitoUserSession.calledOnce, 'CognitoUserSession constructor should be called once');
  t.ok(FakeCognitoUserSession.calledWithMatch(sinon.match(state.user.tokens)), 'CognitoUser constructor should receive { Pool, Username }');

  t.test('rejects when state.user is null', (tt) => {
    tt.plan(1);

    const fullError = {
      message: 'User is unauthenticated',
    };

    actions.updateAttributes({ state: { user: null } }).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
      },
    );
  });

  t.test('rejects when state.user.tokens is null', (tt) => {
    tt.plan(1);

    const fullError = {
      message: 'User is unauthenticated',
    };

    actions.updateAttributes({ state: { user: { tokens: null } } }).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
      },
    );
  });

  t.test('success', (tt) => {
    updateAttributes.reset();

    updateAttributes.withArgs(payload).yields(null, 'SUCCESS');

    actions.updateAttributes({ state }, payload).then(
      () => {
        tt.pass('updateAttributes returned promise.resolve() was called');
      },
    );

    tt.plan(4);

    tt.ok(updateAttributes.called, 'updateAttributes should be called');
    tt.ok(updateAttributes.calledOnce, 'updateAttributes should be called once');
    tt.ok(updateAttributes.calledWith(attributes),
      'cognitoUserPool.updateAttributes first argument should be list of attributes');
  });

  t.test('failure', (tt) => {
    updateAttributes.reset();

    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    updateAttributes.withArgs(attributes).yields(fullError, null);

    tt.plan(1);
    actions.updateAttributes({ state }, payload).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'updateAttributes should reject with { code, message }');
      },
    );
  });

  t.test('reject', (tt) => {
    updateAttributes.reset();

    state.user = null;

    const error = {
      message: 'User is unauthenticated',
    };

    actions.signOut({ state }).catch(
      (err) => {
        tt.deepEqual(err, error, 'updateAttributes should reject if the user is unauthenticated');
      },
    );

    tt.plan(1);
  });
});

test('getUserAttributes', { timeout: 500 }, (t) => {
  FakeCognitoUser.reset();
  FakeCognitoUserSession.reset();

  const getUserAttributes = FakeCognitoUser.prototype.getUserAttributes = sinon.stub();

  const state = {
    user: {
      username: 'test',
      tokens: {
        IdToken: 'id',
        AccessToken: 'access',
        RefreshToken: 'refresh',
      },
    },
  };

  const errorMessage = 'Something went wrong';

  const promise = actions.getUserAttributes({ state });

  t.plan(12);

  t.ok('getUserAttributes' in actions, 'exported actions contain a getUserAttributes method');
  t.ok(promise instanceof Promise, 'getUserAttributes returns a Promise');

  // User tests
  t.ok(FakeCognitoUser.called, 'CognitoUser constructor should be called');
  t.ok(FakeCognitoUser.calledOnce, 'CognitoUser constructor should be called once');
  t.ok(FakeCognitoUser.calledWithMatch(sinon.match({
    Pool: sinon.match.instanceOf(FakeCognitoUserPool),
    Username: state.user.username,
  })), 'CognitoUser constructor should receive { Pool, Username }');

  // Session constructor tests
  t.ok(FakeCognitoUserSession.called, 'CognitoUserSession constructor should be called');
  t.ok(FakeCognitoUserSession.calledOnce, 'CognitoUserSession constructor should be called once');
  t.ok(FakeCognitoUserSession.calledWithMatch(sinon.match(state.user.tokens)), 'CognitoUser constructor should receive { Pool, Username }');

  t.test('rejects when state.user is null', (tt) => {
    tt.plan(1);

    const fullError = {
      message: 'User is unauthenticated',
    };

    actions.getUserAttributes({ state: { user: null } }).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
      },
    );
  });

  t.test('rejects when state.user.tokens is null', (tt) => {
    tt.plan(1);

    const fullError = {
      message: 'User is unauthenticated',
    };

    actions.getUserAttributes({ state: { user: { tokens: null } } }).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'getUserAttributes should reject with { message }');
      },
    );
  });

  t.test('success', (tt) => {
    getUserAttributes.reset();

    const cognitoAttributes = [
      { Name: 'email', Value: 'test@test.com' },
    ];

    getUserAttributes.yields(null, cognitoAttributes);

    actions.getUserAttributes({ commit: commitSpy, state }).then(
      () => {
        tt.pass('getUserAttributes returned promise.resolve() was called');
      },
    );

    tt.plan(6);

    tt.ok(getUserAttributes.called, 'updateAttributes should be called');
    tt.ok(getUserAttributes.calledOnce, 'updateAttributes should be called once');
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.ATTRIBUTES),
      sinon.match({
        email: 'test@test.com',
      }),
    ), `mutation ${types.ATTRIBUTES} should receive attributes map payload`);
  });

  t.test('failure', (tt) => {
    getUserAttributes.reset();

    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    getUserAttributes.yields(fullError, null);

    tt.plan(1);
    actions.getUserAttributes({ state }).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'getUserAttributes should reject with { code, message }');
      },
    );
  });
});

test('signOut', { timeout: 500 }, (t) => {
  commitSpy.reset();
  FakeCognitoUser.reset();

  const cSignOut = FakeCognitoUser.prototype.signOut = sinon.stub();

  const state = {
    user: FakeCognitoUser.prototype,
  };

  const promise = actions.signOut({ commit: commitSpy, state });

  t.plan(4);

  t.ok('signOut' in actions, 'exported actions contain a signOut method');
  t.ok(promise instanceof Promise, 'signOut returns a Promise');

  t.test('success', (tt) => {
    commitSpy.reset();
    cSignOut.reset();

    actions.signOut({ commit: commitSpy, state }).then(
      () => {
        tt.pass('signOut returned promise.resolve() was called');
      },
    );

    tt.plan(6);

    tt.ok(cSignOut.called, 'signOut should be called');
    tt.ok(cSignOut.calledOnce, 'signOut should be called once');
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.SIGNOUT),
    ), `mutation ${types.SIGNOUT} should be commited`);
  });

  t.test('reject', (tt) => {
    commitSpy.reset();
    cSignOut.reset();

    state.user = null;

    const error = {
      message: 'User is unauthenticated',
    };

    tt.plan(1);
    actions.signOut({ commit: commitSpy, state }).catch(
      (err) => {
        tt.deepEqual(err, error, 'signOut should reject if the user is unauthenticated');
      },
    );
  });
});
