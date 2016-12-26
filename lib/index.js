import * as getters from './getters';
import ActionsFactory from './actions';
import mutations from './mutations';

const state = {
  user: null,
};

// const state = {
//   user: {
//     username: 'asdasd',
//     tokens: {
//       IdToken: '',
//       RefreshToken: '',
//       AccessToken: '',
//     },
//   },
// };

export default class CognitoAuth {
  constructor(config) {
    this.state = state;
    this.getters = getters;
    this.actions = new ActionsFactory(config);
    this.mutations = mutations;
  }
}
