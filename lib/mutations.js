import * as types from './mutation-types';

export default {
  [types.SIGNUP](state, payload) {
    state.user = payload;
  },
  [types.CONFIRMED](state) {
    state.user.confirmed = true;
  },
  [types.AUTHENTICATE](state, payload) {
    state.user = payload.user;
    state.tokens = payload.tokens;
  },
};
