import ActionsFactory from './actions';
import mutations from './mutations';
import getters from './getters';

const state = {
  user: null,
};

// Example state
// const state = {
//   user: {
//     username: 'username in any format: email, UUID, etc.',
//     tokens: null | {
//       IdToken: '', // in JWT format
//       RefreshToken: '', // in JWT format
//       AccessToken: '', // in JWT format
//     },
//     attributes: {
//       email: 'user email',
//       phone_number: '+1 555 12345',
//       ...
//     }
//   },
// };

export default class CognitoAuth {
  constructor(config) {
    this.state = state;
    this.actions = new ActionsFactory(config);
    this.mutations = mutations;
    this.getters = getters;
  }
}
