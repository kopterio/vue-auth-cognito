import CognitoUserPool from 'amazon-cognito-identity-js/src/CognitoUserPool';
import AuthenticationDetails from 'amazon-cognito-identity-js/src/AuthenticationDetails';
import CognitoUser from 'amazon-cognito-identity-js/src/CognitoUser';
// import CognitoUserAttribute from 'amazon-cognito-identity-js/src/CognitoUserAttribute';

// Importing Mutation Types
// import { AUTHENTICATE, AUTHENTICATE_FAILURE } from './mutation-types';

export default class Actions {
    /**
   * Constructs a new Actions object
   * @param {object} config Creation config
   * @param {string} config.UserPoolId Amazon Cognito's User Pool ID
   * @param {string} config.ClientId App Client ID
   */
  constructor(config) {
    this.cognitoUserPool = new CognitoUserPool({
      UserPoolId: config.UserPoolId,
      ClientId: config.ClientId,
      Paranoia: 6,
    });

    this.cognitoUser = new CognitoUser({
      Pool: this.cognitoUserPool,
      // Username: '',
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
}

window.Actions = Actions;


    // authenticateUser(this.cognitoUserPool, payload, )
    //   .then(response => commit(AUTHENTICATE, response))
    //   .catch(error => commit(AUTHENTICATE_FAILURE, error))
    //   ;
