// eslint-disable no-console
import CognitoUserPool from 'amazon-cognito-identity-js/src/CognitoUserPool';
import AuthenticationDetails from 'amazon-cognito-identity-js/src/AuthenticationDetails';
import CognitoUser from 'amazon-cognito-identity-js/src/CognitoUser';
import CognitoUserAttribute from 'amazon-cognito-identity-js/src/CognitoUserAttribute';

import * as types from './mutation-types';

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
        const user = cognitoUserPool.getCurrentUser();

        if (user) {
          // Call AUTHENTICATE because it's utterly the same
          commit(types.AUTHENTICATE, user);
          resolve();
        } else {
          reject({
            message: "Can't retrieve current user",
          });
        }
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
        // newPasswordRequired: (details) => {
        //   console.log('new password required', details);
        //   return callback(null, details);
        // },
        // mfaRequired: (details) => {
        //   console.log('mfa required', details);
        //   return callback(null, details);
        // },
        // customChallenge: (details) => {
        //   console.log('custom challenge', details);
        //   return callback(null, details);
        // },
        onSuccess: (session, userConfirmationNecessary) => {
          commit(types.AUTHENTICATE, cognitoUser);
          resolve(userConfirmationNecessary);
        },
      }));
    },

    signUp({ commit }, userInfo) {
      /* userInfo: { username, password, email, name, phone_number } */
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: userInfo.email }),
        new CognitoUserAttribute({ Name: 'name', Value: userInfo.name }),
        new CognitoUserAttribute({ Name: 'phone_number', Value: userInfo.phone_number }),
      ];

      return new Promise((resolve, reject) => {
        cognitoUserPool.signUp(
          userInfo.username, userInfo.password, attributeList, null,
          (err, data) => {
            if (!err) {
              commit(types.AUTHENTICATE, data.user);
              resolve(data.userConfirmed);
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
        const cognitoUser = state.user;

        if (!cognitoUser) {
          reject({
            message: 'User is unauthenticated',
          });
        }

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
        const cognitoUser = state.user;

        if (!cognitoUser) {
          reject({
            message: 'User is unauthenticated',
          });
        }

        cognitoUser.updateAttributes(payload,
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

    signOut({ commit, state }) {
      return new Promise((resolve, reject) => {
        const cognitoUser = state.user;

        if (!cognitoUser) {
          reject({
            message: 'User is unauthenticated',
          });
        }

        cognitoUser.signOut();
        commit(types.SIGNOUT);
        resolve();
      });
    },

  };
}
