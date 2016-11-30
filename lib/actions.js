// eslint-disable no-console
import CognitoUserPool from 'amazon-cognito-identity-js/src/CognitoUserPool';
import AuthenticationDetails from 'amazon-cognito-identity-js/src/AuthenticationDetails';
import CognitoUser from 'amazon-cognito-identity-js/src/CognitoUser';
import CognitoUserAttribute from 'amazon-cognito-identity-js/src/CognitoUserAttribute';

import { SIGNUP, SIGNUP_FAILURE } from './mutation-types';

// cannot use ES6 classes, the methods are not enumerable, properties are.
export default function actionsFactory(config) {
  const cognitoUserPool = new CognitoUserPool({
    UserPoolId: config.UserPoolId,
    ClientId: config.ClientId,
    Paranoia: 6,
  });

  return {

    authenticate({ commit }, payload) {
      const authDetails = new AuthenticationDetails({
        Username: payload.username,
        Password: payload.password,
      });

      const cognitoUser = new CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username,
      });

      cognitoUser.authenticateUser(authDetails, {
        onFailure: (err) => {
          console.log('failure', err, err.stack);
          // return callback(err, null);
          // commit( AUTHENTICATE_FAILURE, err );
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
          console.log('on success', cognitoUser, session, userConfirmationNecessary);
          // commit( AUTHENTICATE, err );
        },
      });
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
              commit(SIGNUP, {
                username: data.user.username,
                confirmed: data.userConfirmed,
              });
              resolve();
              return;
            }
            commit(SIGNUP_FAILURE, { errorMessage: err.message });
            reject();
          });
      });
    },

    confirmRegistration({ commit }, payload) {
      // TODO: check this.cognitoUser
      const cognitoUser = new CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username,
      });

      // console.log(CognitoUser);

      cognitoUser.confirmRegistration(payload.code, true, (err, data) => {
        if (!err) {
          console.log(data);
          // return data;
        }
        console.log(err, err.stack);
        // return { error: 'failure to confirm registration' };
      });
    },

  };
}
