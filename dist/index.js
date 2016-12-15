'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _getters = require('./getters');

var getters = _interopRequireWildcard(_getters);

var _actions = require('./actions');

var _actions2 = _interopRequireDefault(_actions);

var _mutations = require('./mutations');

var _mutations2 = _interopRequireDefault(_mutations);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var state = {
  user: null
};

var CognitoAuth = function CognitoAuth(config) {
  (0, _classCallCheck3.default)(this, CognitoAuth);

  this.state = state;
  this.getters = getters;
  this.actions = new _actions2.default(config);
  this.mutations = _mutations2.default;
};

exports.default = CognitoAuth;