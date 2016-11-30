import test from 'tape';
import Vuex from 'vuex';

import * as types from '../../lib/mutation-types';
import CognitoAuth from '../../lib';

const fakeCognitoConfig = {
  Region: 'us-east-1',
  UserPoolId: 'us-east-1_xxxxxxxxx',
  ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
  IdentityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
};

const store = new Vuex.Store({
  modules: {
    cognito: new CognitoAuth(cognitoConfig),
  },
});

test('cognito mutations', t => {
  
});
