import CognitoUserPool from 'amazon-cognito-identity-js/src/CognitoUserPool';
import AuthenticationDetails from 'amazon-cognito-identity-js/src/AuthenticationDetails';
import CognitoUser from 'amazon-cognito-identity-js/src/CognitoUser';
import CognitoUserAttribute from 'amazon-cognito-identity-js/src/CognitoUserAttribute';

// Potential issues and solutions with using the js library:
//   http://andrewhfarmer.com/aws-sdk-with-webpack/
//   https://github.com/aws/amazon-cognito-identity-js/issues/156
//   https://aws.amazon.com/blogs/mobile/using-webpack-with-the-amazon-cognito-identity-sdk-for-javascript/

// The Cognito UserPool service allows for users to sign-up and add attributes
// about themselves, but requires SRP (secure-remote-password) to authenticate
// with the service. This is where the `amazon-cognito-identity-js` package
// comes and provides the SRP implementation and a wrapper around Cognito APIs.
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html

/* eslint-disable no-console */ // <=== DEBUG

/** @class
 * AuthService is a wrapper around CognitoUserPool & CognitoUser SDKs.
 */
export default class AuthService {

  /*
    config:
      UserPoolId
      ClientId
  */
  constructor(config) {
    this.cognitoUserPool = new CognitoUserPool({
      UserPoolId: config.UserPoolId,
      ClientId: config.ClientId,
      Paranoia: 6,
    });
    this.cognitoUser = new CognitoUser({
      Pool: this.cognitoUserPool,
      Username: '',
    });
  }

  authenticateUser(username, password, callback) {
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });
    this.cognitoUser = new CognitoUser({
      Pool: this.cognitoUserPool,
      Username: username,
    });
    this.cognitoUser.authenticateUser(authDetails, {
      onFailure: (err) => {
        console.log('failure', err, err.stack);
        return callback(err, null);
      },
      newPasswordRequired: (details) => {
        console.log('new password required', details);
        return callback(null, details);
      },
      mfaRequired: (details) => {
        console.log('mfa required', details);
        return callback(null, details);
      },
      customChallenge: (details) => {
        console.log('custom challenge', details);
        return callback(null, details);
      },
      onSuccess: (session, userConfirmationNecessary) => {
        console.log('on success', session, userConfirmationNecessary);
        return callback(null, session);
      },
    });
  }

  currentSession() {
    return this.cognitoUser.getSession((err, data) => {
      console.log(data);
    });
  }

  refreshSession() {
    const refreshToken = this.currentSession().refreshToken;
    this.cognitoUser.refreshSession(refreshToken, (session) => {
      // this.cognitoUserSession = session;
      console.log('refresh session', session);
    });
  }

  isSessionValid() {
    // https://github.com/aws/amazon-cognito-identity-js/blob/master/src/CognitoUserSession.js#L62
    // only checks expiration, doesnt check validity of tokens.
    return this.currentSession() ? this.currentSession().isValid() : false;
  }

  currentUser() {
    if (this.cognitUser) {
      return this.cognitoUserPool.getCurrentUser();
    }
    return null;
  }

  // attribute formats:
  // https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html
  signUp(userInfo) {
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
          console.log(data);
          return data; // { user: CognitoUser(), userConfirmed: boolean }
        }
        console.log(err, err.stack);
        return { error: 'failure to signup a user' };
      });
  }

  signOut() {
    if (this.cognitoUser) {
      this.cognitoUser.signOut();
    }
  }

  globalSignOut() {
    if (this.cognitoUser) {
      this.cognitoUser.globalSignOut({
        onFailure: (err) => {
          console.log('global signout onFailure', err);
        },
        onSuccess: (data) => {
          console.log('global signout onSuccess', data);
        },
      });
    }
  }

  confirmRegistration(code) {
    this.cognitoUser.confirmRegistration(code, true, (err, data) => {
      if (!err) {
        console.log(data);
        return data;
      }
      console.log(err, err.stack);
      return { error: 'failure to confirm registration' };
    });
  }

}

/* DEBUG */
// window.authservice = AuthService;
