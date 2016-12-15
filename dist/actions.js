'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.default = actionsFactory;

var _amazonCognitoIdentityJs = require('amazon-cognito-identity-js');

var _mutationTypes = require('./mutation-types');

var types = _interopRequireWildcard(_mutationTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function actionsFactory(config) {
  var cognitoUserPool = new _amazonCognitoIdentityJs.CognitoUserPool({
    UserPoolId: config.UserPoolId,
    ClientId: config.ClientId,
    Paranoia: 6
  });

  return {
    getCurrentUser: function getCurrentUser(_ref) {
      var commit = _ref.commit;

      return new _promise2.default(function (resolve, reject) {
        var user = cognitoUserPool.getCurrentUser();

        if (user) {
          commit(types.AUTHENTICATE, user);
          resolve();
        } else {
          reject({
            message: "Can't retrieve current user"
          });
        }
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

      return new _promise2.default(function (resolve, reject) {
        return cognitoUser.authenticateUser(authDetails, {
          onFailure: function onFailure(err) {
            reject({
              code: err.code,
              message: err.message
            });
          },
          onSuccess: function onSuccess(session, userConfirmationNecessary) {
            commit(types.AUTHENTICATE, cognitoUser);
            resolve({ userConfirmationNecessary: userConfirmationNecessary });
          }
        });
      });
    },
    signUp: function signUp(_ref3, userInfo) {
      var commit = _ref3.commit;


      return new _promise2.default(function (resolve, reject) {
        cognitoUserPool.signUp(userInfo.username, userInfo.password, userInfo.attributes, null, function (err, data) {
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

      return new _promise2.default(function (resolve, reject) {
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

      return new _promise2.default(function (resolve, reject) {
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

      return new _promise2.default(function (resolve, reject) {
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

      return new _promise2.default(function (resolve, reject) {
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
    changePassword: function changePassword(_ref8, payload) {
      var state = _ref8.state;

      return new _promise2.default(function (resolve, reject) {
        var cognitoUser = state.user;

        if (!(cognitoUser && cognitoUser.signInUserSession !== null && cognitoUser.signInUserSession.isValid())) {
          reject({
            message: 'User is unauthenticated'
          });
        }

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
    updateAttributes: function updateAttributes(_ref9, payload) {
      var commit = _ref9.commit,
          state = _ref9.state;

      return new _promise2.default(function (resolve, reject) {
        var cognitoUser = state.user;

        if (!(cognitoUser && cognitoUser.signInUserSession !== null && cognitoUser.signInUserSession.isValid())) {
          reject({
            message: 'User is unauthenticated'
          });
        }

        cognitoUser.updateAttributes(payload, function (err) {
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
    signOut: function signOut(_ref10) {
      var commit = _ref10.commit,
          state = _ref10.state;

      return new _promise2.default(function (resolve, reject) {
        var cognitoUser = state.user;

        if (!(cognitoUser && cognitoUser.signInUserSession !== null && cognitoUser.signInUserSession.isValid())) {
          reject({
            message: 'User is unauthenticated'
          });
        }

        cognitoUser.signOut();
        commit(types.SIGNOUT);
        resolve();
      });
    }
  };
}