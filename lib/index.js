import * as getters from './getters';
import ActionsFactory from './actions';
import mutations from './mutations';

const state = {
  user: null,
};

export default class CognitoAuth {
  constructor(config) {
    this.state = state;
    this.getters = getters;
    this.actions = new ActionsFactory(config);
    this.mutations = mutations;
  }
}
