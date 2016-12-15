'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _types$AUTHENTICATE$t;

var _mutationTypes = require('./mutation-types');

var types = _interopRequireWildcard(_mutationTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (_types$AUTHENTICATE$t = {}, (0, _defineProperty3.default)(_types$AUTHENTICATE$t, types.AUTHENTICATE, function (state, payload) {
  state.user = payload;
}), (0, _defineProperty3.default)(_types$AUTHENTICATE$t, types.SIGNOUT, function (state) {
  state.user = null;
}), _types$AUTHENTICATE$t);