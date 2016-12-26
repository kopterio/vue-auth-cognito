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

const FakeCognitoUser = sinon.stub();
const FakeCognitoUserPool = sinon.stub();
const FakeAuthenticationDetails = sinon.stub();
const FakeUserAttribute = sinon.stub();
const FakeCognitoUserSession = sinon.stub();
const actions = proxyquire('../../lib/actions', {
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

test.only('getCurrentUser', { timeout: 500 }, (t) => {
  const cGetCurrent = FakeCognitoUserPool.prototype.getCurrentUser = sinon.stub();

  const promise = actions.getCurrentUser({ });

  t.plan(3);

  t.ok('getCurrentUser' in actions, 'exported actions contain a getCurrentUser method');
  t.ok(promise instanceof Promise, 'getCurrentUser returns a Promise');

  t.test('reject when user is null', (tt) => {
    cGetCurrent.reset();

    cGetCurrent.returns(null);

    const fullError = {
      message: "Can't retrieve the current user",
    };

    tt.plan(1);

    // call the signUp action as if it is called by vuex
    actions.getCurrentUser({ commit: commitSpy }).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'signUp should reject with { code, message }');
      }
    );
  });

  t.test('success', (tt) => {
    cGetCurrent.reset();

    const cGetSession = FakeCognitoUser.prototype.getSession = sinon.stub();

    FakeCognitoUser.prototype.getUsername = sinon.stub.returns('testusername');

    const idTokenMethods = { getJwtToken: sinon.stub() };
    FakeCognitoUserSession.prototype.getIdToken = sinon.stub().returns(idTokenMethods);

    // Returns cognitoUser
    cGetCurrent.returns(FakeCognitoUser.prototype);

    cGetSession.yields(null, FakeCognitoUserSession.prototype);

    // call the signUp action as if it is called by vuex
    actions.getCurrentUser({ commit: commitSpy }).then(
      () => {
        tt.pass('getCurrentUser returned promise.resolve() was called');
      }
    );

    tt.plan(6);

    tt.ok(cGetSession.called, 'cognitoUser.getSession should be called');
    tt.ok(cGetSession.calledOnce, 'cognitoUser.getSession should be called exactly once');
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.AUTHENTICATE),
    ), `mutation ${types.AUTHENTICATE} should receive CognitoUser payload`);
  });

  // t.test('onFailure', (tt) => {
  //   cSignUp.reset();

  //   const errorMessage = 'Something went wrong here';

  //   const fullError = {
  //     code: 'NotAuthorizedException',
  //     message: errorMessage,
  //   };

  //   cSignUp.withArgs(userInfo.username, userInfo.password).yields(fullError, null);

  //   tt.plan(1);

  //   actions.signUp({ commit: commitSpy }, userInfo).catch(
  //     (err) => {
  //       tt.deepEqual(err, fullError, 'signUp should reject with { code, message }');
  //     }
  //   );
  // });
});

test('cognito signUp', { timeout: 500 }, (t) => {
  const cSignUp = FakeCognitoUserPool.prototype.signUp = sinon.stub();

  const promise = actions.signUp({ }, userInfo);

  t.plan(4);

  t.ok('signUp' in actions, 'exported actions contain a signUp method');
  t.ok(promise instanceof Promise, 'signUp returns a Promise');

  t.test('onSuccess', (tt) => {
    cSignUp.reset();

    // set CognitoUserPool.signUp to call the callback with err:null,data:stuff
    cSignUp.withArgs(userInfo.username, userInfo.password).yields(null, {
      user: FakeCognitoUser,
    });

    // call the signUp action as if it is called by vuex
    actions.signUp({ commit: commitSpy }, userInfo).then(
      () => {
        tt.pass('signup returned promise.resolve() was called');
      }
    );

    tt.plan(6);

    tt.ok(cSignUp.called, 'cognitoUserPool.signUp should be called');
    tt.ok(cSignUp.calledOnce, 'cognitoUserPool.signUp should be called exactly once');
    tt.ok(cSignUp.calledWith(userInfo.username, userInfo.password, userInfo.attributes),
      'cognitoUserPool.signUp first two arguments should be username and password');
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    // tt.ok(commitSpy.calledWithMatch(
      // sinon.match(types.AUTHENTICATE), sinon.match.instanceOf(FakeCognitoUser)
    // ), `mutation ${types.AUTHENTICATE} should receive CognitoUser payload`);
  });

  t.test('onFailure', (tt) => {
    cSignUp.reset();

    const errorMessage = 'Something went wrong here';

    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    cSignUp.withArgs(userInfo.username, userInfo.password).yields(fullError, null);

    tt.plan(1);

    actions.signUp({ commit: commitSpy }, userInfo).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'signUp should reject with { code, message }');
      }
    );
  });
});

test('cognito confirmRegistration', { timeout: 500 }, (t) => {
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
      }
    );

    tt.plan(4);
    tt.ok(cConfirm.called, 'confirmRegistration should be called');
    tt.ok(cConfirm.calledOnce, 'confirmRegistration should be called once');
    tt.ok(cConfirm.calledWithMatch(
      sinon.match(payload.code)
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

test('cognito authenticateUser', { timeout: 500 }, (t) => {
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

    actions.authenticateUser({ commit: commitSpy }, payload).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'authenticateUser should reject with { code, message }');
      }
    );
  });

  t.test('onSuccess', (tt) => {
    commitSpy.reset();

    const userConfirmationNecessary = true;

    const cAuth = FakeCognitoUser.prototype.authenticateUser =
      sinon.spy((authDetails, callbacks) => {
        callbacks.onSuccess(FakeCognitoUser, userConfirmationNecessary);
      });

    actions.authenticateUser({ commit: commitSpy }, payload).then(
      () => {
        tt.pass('authenticateUser returned promise.resolve() was called');
      }
    );

    tt.plan(6);

    tt.ok(cAuth.called, 'cognitoUser.authenticateUser should be called');
    tt.ok(cAuth.calledOnce, 'cognitoUser.authenticateUser should be called once');
    tt.ok(cAuth.calledWithMatch(
      sinon.match.instanceOf(FakeAuthenticationDetails)
    ), "cognitoUser.authenticateUser's first argument should be AuthenticationDetails");

    tt.ok(commitSpy.called, 'commit should be called');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.AUTHENTICATE), sinon.match.instanceOf(FakeCognitoUser)
    ), `mutation ${types.AUTHENTICATE} should receive CognitoUser payload`);
  });
});

test('cognito confirmPassword', { timeout: 500 }, (t) => {
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
      }
    );

    tt.plan(4);

    tt.ok(cConfirm.called, 'confirmPassword should be called');
    tt.ok(cConfirm.calledOnce, 'confirmPassword should be called once');
    tt.ok(cConfirm.calledWithMatch(
      sinon.match(payload.code)
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
      }
    );
  });
});

test('cognito resendConfirmationCode', { timeout: 500 }, (t) => {
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
      }
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
      }
    );
  });
});

test('cognito changePassword', { timeout: 500 }, (t) => {
  FakeCognitoUser.reset();

  const cChange = FakeCognitoUser.prototype.changePassword = sinon.stub();

  const payload = {
    oldPassword: 'test',
    newPassword: 'test1',
  };

  const state = {
    user: FakeCognitoUser.prototype,
  };

  const errorMessage = 'Something went wrong';

  const promise = actions.changePassword({ state }, payload);

  t.plan(5);

  t.ok('changePassword' in actions, 'exported actions contain a changePassword method');
  t.ok(promise instanceof Promise, 'changePassword returns a Promise');

  t.test('success', (tt) => {
    cChange.reset();

    cChange.withArgs(payload.oldPassword, payload.newPassword).yields(null, 'SUCCESS');

    actions.changePassword({ state }, payload).then(
      () => {
        tt.pass('changePassword returned promise.resolve() was called');
      }
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
      }
    );
  });

  t.test('reject', (tt) => {
    cChange.reset();

    state.user = null;

    const error = {
      message: 'User is unauthenticated',
    };

    tt.plan(1);

    actions.changePassword({ state }).catch(
      (err) => {
        tt.deepEqual(err, error, 'changePassword should reject if the user is unauthenticated');
      }
    );
  });
});

test('cognito updateAttributes', { timeout: 500 }, (t) => {
  FakeCognitoUser.reset();

  const cUpdate = FakeCognitoUser.prototype.updateAttributes = sinon.stub();

  const payload = [
    new FakeUserAttribute({ Name: 'email', Value: userInfo.email }),
    new FakeUserAttribute({ Name: 'name', Value: userInfo.name }),
    new FakeUserAttribute({ Name: 'phone_number', Value: userInfo.phone_number }),
  ];

  const state = {
    user: FakeCognitoUser.prototype,
  };

  const errorMessage = 'Something went wrong';

  cUpdate.withArgs(payload).yields(null);

  const promise = actions.updateAttributes({ state }, payload);

  t.plan(5);

  t.ok('updateAttributes' in actions, 'exported actions contain a updateAttributes method');
  t.ok(promise instanceof Promise, 'updateAttributes returns a Promise');

  t.test('success', (tt) => {
    cUpdate.reset();

    cUpdate.withArgs(payload).yields(null, 'SUCCESS');

    actions.updateAttributes({ state }, payload).then(
      () => {
        tt.pass('updateAttributes returned promise.resolve() was called');
      }
    );

    tt.plan(4);

    tt.ok(cUpdate.called, 'updateAttributes should be called');
    tt.ok(cUpdate.calledOnce, 'updateAttributes should be called once');
    tt.ok(cUpdate.calledWith(payload),
      'cognitoUserPool.updateAttributes first argument should be list of attributes');
  });

  t.test('failure', (tt) => {
    cUpdate.reset();

    const fullError = {
      code: 'NotAuthorizedException',
      message: errorMessage,
    };

    cUpdate.withArgs(payload).yields(fullError, null);

    tt.plan(1);
    actions.updateAttributes({ state }, payload).catch(
      (err) => {
        tt.deepEqual(err, fullError, 'updateAttributes should reject with { code, message }');
      }
    );
  });

  t.test('reject', (tt) => {
    cUpdate.reset();

    state.user = null;

    const error = {
      message: 'User is unauthenticated',
    };

    actions.signOut({ state }).catch(
      (err) => {
        tt.deepEqual(err, error, 'updateAttributes should reject if the user is unauthenticated');
      }
    );

    tt.plan(1);
  });
});

test('cognito signOut', { timeout: 500 }, (t) => {
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
      }
    );

    tt.plan(6);

    tt.ok(cSignOut.called, 'signOut should be called');
    tt.ok(cSignOut.calledOnce, 'signOut should be called once');
    tt.ok(commitSpy.called, 'state.commit should be called');
    tt.ok(commitSpy.calledOnce, 'state.commit should be called exactly once');
    tt.ok(commitSpy.calledWithMatch(
      sinon.match(types.SIGNOUT)
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
      }
    );
  });
});
