'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getters = require('./getters');

var getters = _interopRequireWildcard(_getters);

var _actions = require('./actions');

var _actions2 = _interopRequireDefault(_actions);

var _mutations = require('./mutations');

var _mutations2 = _interopRequireDefault(_mutations);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var state = {
  user: null
};

// const state = {
//   user: {
//     username: 'asdasd',
//     tokens: {
//       IdToken: '',
//       RefreshToken: '',
//       AccessToken: '',
//     },
//   },
// };

var CognitoAuth = function CognitoAuth(config) {
  _classCallCheck(this, CognitoAuth);

  this.state = state;
  this.getters = getters;
  this.actions = new _actions2.default(config);
  this.mutations = _mutations2.default;
};

exports.default = CognitoAuth;