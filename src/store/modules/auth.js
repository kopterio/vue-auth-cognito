import authService from '../../services/auth';
import { AUTHENTICATE, AUTHENTICATE_FAILURE } from '../mutation-types';

const state = {
  user: null,
  token: null,
  failure: null,
};

const getters = {
  user: statex => statex.user,
  token: statex => statex.token,
  failure: statex => statex.failure,
};

const actions = {
  authenticate({ commit }, payload) {
    authService.authenticate(payload)
      .then(response => commit(AUTHENTICATE, response))
      .catch(error => commit(AUTHENTICATE_FAILURE, error))
      ;
  },
};

const mutations = {
  [AUTHENTICATE](statex, response) {
    statex.user = response.user;
    statex.token = response.token;
  },
  [AUTHENTICATE_FAILURE](statex, error) {
    statex.failure = error;
  },
};

export default {
  state,
  getters,
  actions,
  mutations,
};
