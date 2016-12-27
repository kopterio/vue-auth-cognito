import ActionsFactory from './actions';
import mutations from './mutations';

const state = {
  user: null,
};

// Example state
// const state = {
//   user: {
//     username: 'username in any format: email, UUID, etc.',
//     tokens: {
//       IdToken: '', // in JWT format
//       RefreshToken: '', // in JWT format
//       AccessToken: '', // in JWT format
//     },
//   },
// };

export default class CognitoAuth {
  constructor(config) {
    this.state = state;
    this.actions = new ActionsFactory(config);
    this.mutations = mutations;
  }
}
