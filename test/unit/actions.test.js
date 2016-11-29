import test from 'tape';

// import proxyquire from 'proxyquire'

// const Actions = proxyquire('../../lib/actions', {
//   'amazon-cognito-identity-js/src/CognitoUserPool':
// });

import * as types from '../../lib/mutation-types'

import Actions from '../../lib/actions';
import config from '../../config/cognito';

test('cognito signUp', (t) => {
  const actions = new Actions(config);

  const userInfo = {
    username: 'test',
    password: 'Qwerty123!',
    email: 'test@test.com',
    name: 'MegaTest',
    phone_number: '+155512345'
  }

  t.test('success', (t) => {
    actions.cognitoUserPool = {
      signUp: (username, password, attributeList, validationData, callback) => {
        t.equal(username, userInfo.username, 'cognitoUserPool.signUp should receive username')
        t.equal(password, userInfo.password, 'cognitoUserPool.signUp should receive password')
        callback(null, {
          user: {
            username: userInfo.username
          },
          userConfirmed: false
        })
      }
    }

    t.plan(5)

    const commit = (type, payload) => {
      t.equal(type, types.SIGNUP, `vuex mutation type should be ${types.SIGNUP}`)
      t.equal(payload.username, userInfo.username, 'vuex mutation should receive payload.username')
      t.equal(payload.confirmed, false, 'vuex mutation should receive payload.confirmed')
    }

    actions.signUp({ commit }, userInfo)

    t.end();
  })

  t.test('failure', (t) => {
    actions.cognitoUserPool = {
      signUp: (username, password, attributeList, validationData, callback) => {
        /*
          code: string = "NotAuthorizedException"
          message: string = "Incorrect username or password"
          name: string = "NotAuthorizedException"
          retryDelay: float = 55.49
          stack: string = "NotAuthorizedException"
          statusCode: integer = 400
        */
        callback({
          code: "MissingParameter",
          message: "Incorrect username or password",
          stack: "" 
        })
      }
    }

    t.plan(1)

    const commit = (type, payload) => {
      t.equal(type, types.SIGNUP_FAILURE, `vuex mutation type should be ${types.SIGNUP_FAILURE}`)
      // t.equal(payload.username, userInfo.username, 'vuex mutation should receive payload.username')
      // t.equal(payload.confirmed, false, 'vuex mutation should receive payload.confirmed')
    }

    actions.signUp({ commit }, userInfo)

    t.end();
  })
});
