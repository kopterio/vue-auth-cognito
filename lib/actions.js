'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = actionsFactory;

var _amazonCognitoIdentityJs = require('amazon-cognito-identity-js');

var _mutationTypes = require('./mutation-types');

var types = _interopRequireWildcard(_mutationTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function constructUser(cognitoUser, session) {
  return {
    username: cognitoUser.getUsername(),
    tokens: {
      IdToken: session.getIdToken().getJwtToken(),
      RefreshToken: session.getRefreshToken().getJwtToken(),
      AccessToken: session.getAccessToken().getJwtToken()
    }
  };
}

// cannot use ES6 classes, the methods are not enumerable, properties are.
function actionsFactory(config) {
  var cognitoUserPool = new _amazonCognitoIdentityJs.CognitoUserPool({
    UserPoolId: config.UserPoolId,
    ClientId: config.ClientId,
    Paranoia: 6
  });

  return {
    getCurrentUser: function getCurrentUser(_ref) {
      var commit = _ref.commit;

      return new Promise(function (resolve, reject) {
        var cognitoUser = cognitoUserPool.getCurrentUser();

        if (!cognitoUser) {
          reject({
            message: "Can't retrieve the current user"
          });
          return;
        }

        cognitoUser.getSession(function (err, session) {
          if (err) {
            reject({
              message: "Can't retrieve user's session"
            });
            return;
          }
          // Call AUTHENTICATE because it's utterly the same
          commit(types.AUTHENTICATE, constructUser(cognitoUser, session));
          resolve();
        });
      });
    },
    authenticateUser: function authenticateUser(_ref2, payload) {
      var commit = _ref2.commit;

      var authDetails = new _amazonCognitoIdentityJs.AuthenticationDetails({
        Username: payload.username,
        Password: payload.password
      });

      var cognitoUser = new _amazonCognitoIdentityJs.CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username
      });

      return new Promise(function (resolve, reject) {
        return cognitoUser.authenticateUser(authDetails, {
          onFailure: function onFailure(err) {
            reject({
              code: err.code,
              message: err.message
            });
          },
          onSuccess: function onSuccess(session, userConfirmationNecessary) {
            commit(types.AUTHENTICATE, constructUser(cognitoUser, session));
            resolve({ userConfirmationNecessary: userConfirmationNecessary });
          }
        });
      });
    },
    signUp: function signUp(_ref3, userInfo) {
      var commit = _ref3.commit;

      /* userInfo: { username, password, attributes } */
      var userAttributes = [];

      (userInfo.attributes || []).forEach(function (attr) {
        userAttributes.push(new _amazonCognitoIdentityJs.CognitoUserAttribute({
          Name: attr.name,
          Value: attr.value
        }));
      });

      return new Promise(function (resolve, reject) {
        cognitoUserPool.signUp(userInfo.username, userInfo.password, userAttributes, null, function (err, data) {
          if (!err) {
            commit(types.AUTHENTICATE, data.user);
            resolve({ userConfirmationNecessary: !data.userConfirmed });
            return;
          }
          reject({
            code: err.code,
            message: err.message
          });
        });
      });
    },
    confirmRegistration: function confirmRegistration(_ref4, payload) {
      var state = _ref4.state;

      var cognitoUser = new _amazonCognitoIdentityJs.CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username
      });

      return new Promise(function (resolve, reject) {
        cognitoUser.confirmRegistration(payload.code, true, function (err) {
          if (!err) {
            resolve();
            return;
          }
          reject({
            code: err.code,
            message: err.message
          });
        });
      });
    },
    resendConfirmationCode: function resendConfirmationCode(_ref5, payload) {
      var commit = _ref5.commit;

      var cognitoUser = new _amazonCognitoIdentityJs.CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username
      });

      return new Promise(function (resolve, reject) {
        cognitoUser.resendConfirmationCode(function (err) {
          if (!err) {
            resolve();
            return;
          }
          reject({
            code: err.code,
            message: err.message
          });
        });
      });
    },
    forgotPassword: function forgotPassword(_ref6, payload) {
      var commit = _ref6.commit;

      var cognitoUser = new _amazonCognitoIdentityJs.CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username
      });

      return new Promise(function (resolve, reject) {
        return cognitoUser.forgotPassword({
          onSuccess: function onSuccess() {
            resolve();
          },
          onFailure: function onFailure(err) {
            reject({
              code: err.code,
              message: err.message
            });
          }
        });
      });
    },
    confirmPassword: function confirmPassword(_ref7, payload) {
      var commit = _ref7.commit;

      var cognitoUser = new _amazonCognitoIdentityJs.CognitoUser({
        Pool: cognitoUserPool,
        Username: payload.username
      });

      return new Promise(function (resolve, reject) {
        cognitoUser.confirmPassword(payload.code, payload.newPassword, {
          onFailure: function onFailure(err) {
            reject({
              code: err.code,
              message: err.message
            });
          },
          onSuccess: function onSuccess() {
            resolve();
          }
        });
      });
    },


    // Only for authenticated users
    changePassword: function changePassword(_ref8, payload) {
      var state = _ref8.state;

      return new Promise(function (resolve, reject) {
        // Make sure the user is authenticated
        if (state.user === null) {
          reject({
            message: 'User is unauthenticated'
          });
          return;
        }

        var cognitoUser = new _amazonCognitoIdentityJs.CognitoUser({
          Pool: cognitoUserPool,
          Username: state.user.username
        });

        // Restore session without making an additional call to API
        cognitoUser.signInUserSession = new _amazonCognitoIdentityJs.CognitoUserSession(state.user.tokens);

        cognitoUser.changePassword(payload.oldPassword, payload.newPassword, function (err) {
          if (!err) {
            resolve();
            return;
          }
          reject({
            code: err.code,
            message: err.message
          });
        });
      });
    },


    // Only for authenticated users
    updateAttributes: function updateAttributes(_ref9, payload) {
      var commit = _ref9.commit,
          state = _ref9.state;

      return new Promise(function (resolve, reject) {
        // Make sure the user is authenticated
        if (state.user === null) {
          reject({
            message: 'User is unauthenticated'
          });
          return;
        }

        var cognitoUser = new _amazonCognitoIdentityJs.CognitoUser({
          Pool: cognitoUserPool,
          Username: state.user.username
        });

        // Restore session without making an additional call to API
        cognitoUser.signInUserSession = new _amazonCognitoIdentityJs.CognitoUserSession(state.user.tokens);

        var attributes = [];

        (payload || []).forEach(function (attr) {
          attributes.push(new _amazonCognitoIdentityJs.CognitoUserAttribute({
            Name: attr.name,
            Value: attr.value
          }));
        });

        cognitoUser.updateAttributes(attributes, function (err) {
          if (!err) {
            resolve();
            return;
          }
          reject({
            code: err.code,
            message: err.message
          });
        });
      });
    },


    // Only for authenticated users
    signOut: function signOut(_ref10) {
      var commit = _ref10.commit,
          state = _ref10.state;

      return new Promise(function (resolve, reject) {
        // Make sure the user is authenticated
        if (state.user === null) {
          reject({
            message: 'User is unauthenticated'
          });
          return;
        }

        var cognitoUser = new _amazonCognitoIdentityJs.CognitoUser({
          Pool: cognitoUserPool,
          Username: state.user.username
        });

        cognitoUser.signOut();
        commit(types.SIGNOUT);
        resolve();
      });
    }
  };
}