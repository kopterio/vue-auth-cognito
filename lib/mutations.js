'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _types$AUTHENTICATE$t;

var _mutationTypes = require('./mutation-types');

var types = _interopRequireWildcard(_mutationTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

exports.default = (_types$AUTHENTICATE$t = {}, _defineProperty(_types$AUTHENTICATE$t, types.AUTHENTICATE, function (state, payload) {
  state.user = payload;
}), _defineProperty(_types$AUTHENTICATE$t, types.SIGNOUT, function (state) {
  state.user = null;
}), _types$AUTHENTICATE$t);