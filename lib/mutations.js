import * as types from './mutation-types';

export default {
  [types.AUTHENTICATE](state, payload) {
    state.user = payload;
  },
  [types.SIGNOUT](state) {
    state.user = null;
  },
};
