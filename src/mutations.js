import * as types from './mutation-types';

export default {
  [types.AUTHENTICATE](state, payload) {
    state.user = payload;
  },
  [types.SIGNOUT](state) {
    state.user = null;
  },
  [types.ATTRIBUTES](state, payload) {
    state.user.attributes = payload;
  },
  [types.COGNITOUSER](state, payload) {
    state.cognitoUser = payload;
  },
  [types.REMOVECOGNITOUSER](state) {
    state.cognitoUser = null;
  },
};
