// Importing Mutation Types
// import { AUTHENTICATE, AUTHENTICATE_FAILURE } from './mutation-types';

import * as types from './mutation-types';

export default {
  [types.SIGNUP](state, payload) {
    state.user = payload
  }

  // [AUTHENTICATE](statex, response) {
  //   statex.user = response.user;
  //   statex.token = response.token;
  // },
  // [AUTHENTICATE_FAILURE](statex, error) {
  //   statex.failure = error;
  // },
};
