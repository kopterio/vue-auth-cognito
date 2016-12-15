"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.user = user;
exports.username = username;
function user(state) {
  return state.user;
}
function username(state) {
  return state.user.getUsername();
}