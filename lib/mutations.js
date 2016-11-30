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
  // [AUTHENTICATE](statex, response) {
  //   statex.user = response.user;
  //   statex.token = response.token;
  // },
  // [AUTHENTICATE_FAILURE](statex, error) {
  //   statex.failure = error;
  // },
};
