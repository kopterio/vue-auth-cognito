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
          // commit(types.AUTHENTICATE_FAILURE, { errorMessage: err.message });
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
          const mutationPayload = {
            user: {
              confirmed: !userConfirmationNecessary,
              username: payload.username,
            },
            tokens: {
              id: {
                jwt: session.getIdToken().getJwtToken(),
                expiration: session.getIdToken().getExpiration(),
              },
              refresh: { jwt: session.getRefreshToken().getToken() },
              access: {
                jwt: session.getAccessToken().getJwtToken(),
                expiration: session.getAccessToken().getExpiration(),
              },
            },
          };
          commit(types.AUTHENTICATE, mutationPayload);
          resolve();
        },
      }));
    },

    signUp({ commit }, userInfo) {
      /*
      userInfo: {
        username: '',
        password: '',
        email: '',
        name: '',
        phone_number: ''
      }
      */
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: userInfo.email }),
        new CognitoUserAttribute({ Name: 'name', Value: userInfo.name }),
        new CognitoUserAttribute({ Name: 'phone_number', Value: userInfo.phone_number }),
      ];

      // commit(SIGNUP_REQUEST);

      return new Promise((resolve, reject) => {
        cognitoUserPool.signUp(
          userInfo.username, userInfo.password, attributeList, null,
          (err, data) => {
            if (!err) {
              commit(types.SIGNUP, {
                username: data.user.username,
                confirmed: data.userConfirmed,
              });
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

    confirmRegistration({ commit }, payload) {
      // TODO: check this.cognitoUser
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

    confirmPassword({ commit }, payload) {
      // TODO: check this.cognitoUser
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

  };
}
