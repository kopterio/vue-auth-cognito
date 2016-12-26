import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  CognitoUserSession,
  AuthenticationDetails } from 'amazon-cognito-identity-js';

import * as types from './mutation-types';

function constructUser(cognitoUser, session) {
  return {
    username: cognitoUser.getUsername(),
    tokens: {
      IdToken: session.getIdToken().getJwtToken(),
      RefreshToken: session.getRefreshToken().getJwtToken(),
      AccessToken: session.getAccessToken().getJwtToken(),
    },
  };
}

// cannot use ES6 classes, the methods are not enumerable, properties are.
export default function actionsFactory(config) {
  const cognitoUserPool = new CognitoUserPool({
    UserPoolId: config.UserPoolId,
    ClientId: config.ClientId,
    Paranoia: 6,
  });

  return {

    getCurrentUser({ commit }) {
      return new Promise((resolve, reject) => {
        const cognitoUser = cognitoUserPool.getCurrentUser();

        if (!cognitoUser) {
          reject({
            message: "Can't retrieve the current user",
          });
          return;
        }

        cognitoUser.getSession((err, session) => {
          if (err) {
            reject({
              code: err.code,
              message: err.message,
            });
            return;
          }
          // Call AUTHENTICATE because it's utterly the same
          commit(types.AUTHENTICATE, constructUser(cognitoUser, session));
          resolve();
        });
      });
    },

    authenticateUser({ commit }, payload) {
      const authDetails = new AuthenticationDetails({
        Username: payload.username,
        Password: payload.password,
      });

      const cognitoUser = new CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username,
      });

      return new Promise((resolve, reject) => cognitoUser.authenticateUser(authDetails, {
        onFailure: (err) => {
          reject({
            code: err.code,
            message: err.message,
          });
        },
        onSuccess: (session, userConfirmationNecessary) => {
          commit(types.AUTHENTICATE, constructUser(cognitoUser, session));
          resolve({ userConfirmationNecessary });
        },
      }));
    },

    signUp({ commit }, userInfo) {
      /* userInfo: { username, password, attributes } */
      const userAttributes = [];

      (userInfo.attributes || []).forEach((attr) => {
        userAttributes.push(new CognitoUserAttribute({
          Name: attr.name,
          Value: attr.value,
        }));
      });

      return new Promise((resolve, reject) => {
        cognitoUserPool.signUp(
          userInfo.username, userInfo.password, userAttributes, null,
          (err, data) => {
            if (!err) {
              commit(types.AUTHENTICATE, data.user);
              resolve({ userConfirmationNecessary: !data.userConfirmed });
              return;
            }
            reject({
              code: err.code,
              message: err.message,
            });
          });
      });
    },

    confirmRegistration({ state }, payload) {
      const cognitoUser = new CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(payload.code, true, (err) => {
          if (!err) {
            resolve();
            return;
          }
          reject({
            code: err.code,
            message: err.message,
          });
        });
      });
    },

    resendConfirmationCode({ commit }, payload) {
      const cognitoUser = new CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.resendConfirmationCode(
          (err) => {
            if (!err) {
              resolve();
              return;
            }
            reject({
              code: err.code,
              message: err.message,
            });
          });
      });
    },

    forgotPassword({ commit }, payload) {
      const cognitoUser = new CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username,
      });

      return new Promise((resolve, reject) => cognitoUser.forgotPassword({
        onSuccess() {
          resolve();
        },
        onFailure(err) {
          reject({
            code: err.code,
            message: err.message,
          });
        },
      }));
    },

    confirmPassword({ commit }, payload) {
      const cognitoUser = new CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username,
      });

      return new Promise((resolve, reject) => {
        cognitoUser.confirmPassword(payload.code, payload.newPassword, {
          onFailure(err) {
            reject({
              code: err.code,
              message: err.message,
            });
          },
          onSuccess() {
            resolve();
          },
        });
      });
    },

    // Only for authenticated users
    changePassword({ state }, payload) {
      return new Promise((resolve, reject) => {
        // Make sure the user is authenticated
        if (state.user === null) {
          reject({
            message: 'User is unauthenticated',
          });
          return;
        }

        const cognitoUser = new CognitoUser({
          Pool: cognitoUserPool,
          Username: state.user.username,
        });

        // Restore session without making an additional call to API
        cognitoUser.signInUserSession = new CognitoUserSession(state.user.tokens);

        cognitoUser.changePassword(payload.oldPassword, payload.newPassword,
          (err) => {
            if (!err) {
              resolve();
              return;
            }
            reject({
              code: err.code,
              message: err.message,
            });
          });
      });
    },

    // Only for authenticated users
    updateAttributes({ commit, state }, payload) {
      return new Promise((resolve, reject) => {
        // Make sure the user is authenticated
        if (state.user === null) {
          reject({
            message: 'User is unauthenticated',
          });
          return;
        }

        const cognitoUser = new CognitoUser({
          Pool: cognitoUserPool,
          Username: state.user.username,
        });

        // Restore session without making an additional call to API
        cognitoUser.signInUserSession = new CognitoUserSession(state.user.tokens);

        const attributes = [];

        (payload || []).forEach((attr) => {
          attributes.push(new CognitoUserAttribute({
            Name: attr.name,
            Value: attr.value,
          }));
        });

        cognitoUser.updateAttributes(attributes,
          (err) => {
            if (!err) {
              resolve();
              return;
            }
            reject({
              code: err.code,
              message: err.message,
            });
          });
      });
    },

    // Only for authenticated users
    signOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        // Make sure the user is authenticated
        if (state.user === null) {
          reject({
            message: 'User is unauthenticated',
          });
          return;
        }

        const cognitoUser = new CognitoUser({
          Pool: cognitoUserPool,
          Username: state.user.username,
        });

        cognitoUser.signOut();
        commit(types.SIGNOUT);
        resolve();
      });
    },
  };
}
