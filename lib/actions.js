// eslint-disable no-console
import CognitoUserPool from 'amazon-cognito-identity-js/src/CognitoUserPool';
import AuthenticationDetails from 'amazon-cognito-identity-js/src/AuthenticationDetails';
import CognitoUser from 'amazon-cognito-identity-js/src/CognitoUser';
import CognitoUserAttribute from 'amazon-cognito-identity-js/src/CognitoUserAttribute';

// Importing Mutation Types
import { SIGNUP } from './mutation-types';

export default class Actions {
    /**
   * Constructs a new Actions object
   * @param {object} config Creation config
   * @param {string} config.UserPoolId Amazon Cognito's User Pool ID
   * @param {string} config.ClientId App Client ID
   */
  constructor(config) {
    // TODO: validate config

    this.cognitoUserPool = new CognitoUserPool({
      UserPoolId: config.UserPoolId,
      ClientId: config.ClientId,
      Paranoia: 6,
    });
  }

  authenticate({ commit }, payload) {
    const authDetails = new AuthenticationDetails({
      Username: payload.username,
      Password: payload.password,
    });

    const cognitoUser = new CognitoUser({
      Pool: this.cognitoUserPool,
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
  }

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

    this.cognitoUserPool.signUp(
      userInfo.username, userInfo.password, attributeList, null,
      (err, data) => {
        if (!err) {
          // console.log(data);
          commit(SIGNUP, {
            username: data.user.username,
            confirmed: data.userConfirmed,
          });
          return; // { user: CognitoUser(), userConfirmed: boolean }
        }
        console.log(err, err.stack);
        // return { error: 'failure to signup a user' };
      });
  }

  confirmRegistration({ commit }, payload) {
    // TODO: check this.cognitoUser
    const cognitoUser = new CognitoUser({
      Pool: this.cognitoUserPool,
      Username: payload.username,
    });

    cognitoUser.confirmRegistration(payload.code, true, (err, data) => {
      if (!err) {
        console.log(data);
        // return data;
      }
      console.log(err, err.stack);
      // return { error: 'failure to confirm registration' };
    });
  }
}

// window.Actions = Actions;


    // authenticateUser(this.cognitoUserPool, payload, )
    //   .then(response => commit(AUTHENTICATE, response))
    //   .catch(error => commit(AUTHENTICATE_FAILURE, error))
    //   ;
