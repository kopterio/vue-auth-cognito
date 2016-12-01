// Importing Mutation Types
// import { AUTHENTICATE, AUTHENTICATE_FAILURE } from './mutation-types';

import * as types from './mutation-types';

export default {
  [types.SIGNUP](state, payload) {
    state.failure = null;
    state.user = payload;
  },
  [types.SIGNUP_FAILURE](state, payload) {
    state.failure = payload.errorMessage;
  },

  [types.CONFIRMED](state) {
    state.failure = null;
    state.user.confirmed = true;
  },
  [types.CONFIRMED_FAILURE](state, payload) {
    state.failure = payload.errorMessage;
  },
  [types.AUTHENTICATE](state, response) {
    state.failure = null;
    state.user = response.user;
    state.tokens = response.tokens;
  },
  [types.AUTHENTICATE_FAILURE](statex, error) {
    statex.failure = error.errorMessage;
    statex.user = null;
  },
};
