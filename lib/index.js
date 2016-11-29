import * as getters from './getters';
import Actions from './actions';
import mutations from './mutations';

const state = {
  user: null,
  token: null,
  failure: null,
};

export default class CognitoAuth {
  constructor(config) {
    this.state = state;
    this.getters = getters;
    this.actions = new Actions(config);
    this.mutations = mutations;
  }
}
