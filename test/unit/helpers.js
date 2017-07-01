import proxyquire from 'proxyquire';
import * as sinon from 'sinon';

import fakeCognitoConfig from './config';

export function createModule(opts = {}) {
  const CognitoUserPool = sinon.stub();
  const AuthenticationDetails = sinon.stub();
  const UserAttribute = sinon.stub();
  const CognitoUser = sinon.stub();

  // Create our module
  const module = proxyquire('../../src/actions', {
    'amazon-cognito-identity-js': {
      CognitoUserPool,
      CognitoUser,
      AuthenticationDetails,
      UserAttribute,
    },
  }).default(fakeCognitoConfig); // call the default exported function with config

  // fixture for user details
  const userInfo = {
    username: 'test',
    password: 'Qwerty123!',
    attributes: [
      { Name: 'email', Value: 'test@email' },
      { Name: 'name', Value: 'Richard' },
      { Name: 'phone_number', Value: '+1555234567' },
    ],
  };

  const currentUser = {
    getSession: sinon.stub(),
    getUsername: sinon.stub().returns('testusername'),
  };

  // Some required methods
  const getCurrentUser = CognitoUserPool.prototype.getCurrentUser = sinon.stub().returns(currentUser);
  const signUp = CognitoUserPool.prototype.signUp = sinon.stub();

  const authenticateUser = CognitoUser.prototype.authenticateUser = sinon.spy(opts.authenticateUser);

  const getUsername = CognitoUser.prototype.getUsername = sinon.stub();
  const getUserAttributes = CognitoUser.prototype.getUserAttributes = sinon.stub();
  const getCognitoUserSession = CognitoUser.prototype.getCognitoUserSession = sinon.stub();
  const updateAttributes = CognitoUser.prototype.updateAttributes = sinon.stub();
  const changePassword = CognitoUser.prototype.changePassword = sinon.stub();
  const resendConfirmationCode = CognitoUser.prototype.resendConfirmationCode = sinon.stub();
  const confirmPassword = CognitoUser.prototype.confirmPassword = sinon.stub();
  const forgotPassword = CognitoUser.prototype.forgotPassword = sinon.spy(opts.forgotPassword);
  const confirmRegistration = CognitoUser.prototype.confirmRegistration = sinon.stub();
  const signOut = CognitoUser.prototype.signOut = sinon.stub();

  return {
    module,
    fake: {
      CognitoUserPool,
      CognitoUser,
      AuthenticationDetails,
      UserAttribute,
      commit: sinon.stub(),
    },
    methods: {
      CognitoUser: {
        authenticateUser,
        getUsername,
        getUserAttributes,
        getCognitoUserSession,
        updateAttributes,
        changePassword,
        resendConfirmationCode,
        confirmPassword,
        confirmRegistration,
        forgotPassword,
        signOut,
      },
      CognitoUserPool: {
        getCurrentUser,
        signUp,
      },
    },
    mock: {
      userInfo,
      currentUser,
    },
  };
}

// Some helpers for tests
export function createSessionStub() {
  const idTokenMethods = { getJwtToken: sinon.stub().returns('id') };
  const accessTokenMethods = { getJwtToken: sinon.stub().returns('access') };
  const refreshTokenMethods = { getToken: sinon.stub().returns('refresh') };

  return {
    getIdToken: sinon.stub().returns(idTokenMethods),
    getRefreshToken: sinon.stub().returns(refreshTokenMethods),
    getAccessToken: sinon.stub().returns(accessTokenMethods),
  };
}
