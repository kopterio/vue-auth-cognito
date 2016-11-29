// Importing Mutation Types
import { AUTHENTICATE, AUTHENTICATE_FAILURE } from './mutation-types';

export default {
  [AUTHENTICATE](statex, response) {
    statex.user = response.user;
    statex.token = response.token;
  },
  [AUTHENTICATE_FAILURE](statex, error) {
    statex.failure = error;
  },
};
