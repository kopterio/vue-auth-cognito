# vue-auth-cognito

[![npm](https://img.shields.io/npm/v/vue-auth-cognito.svg)](https://www.npmjs.com/package/vue-auth-cognito)
[![Build Status](https://travis-ci.org/kopterio/vue-auth-cognito.svg?branch=master)](https://travis-ci.org/kopterio/vue-auth-cognito)
[![Code Climate](https://codeclimate.com/github/kopterio/vue-auth-cognito/badges/gpa.svg)](https://codeclimate.com/github/kopterio/vue-auth-cognito)
[![Coverage Status](https://coveralls.io/repos/github/kopterio/vue-auth-cognito/badge.svg?branch=master)](https://coveralls.io/github/kopterio/vue-auth-cognito?branch=master)
[![Greenkeeper Badge](https://badges.greenkeeper.io/kopterio/vue-auth-cognito.svg)](https://greenkeeper.io/)

This small library serves as a wrapper of Amazon Cognito for Vuex.

# Actions for dispatch method

All actions return a promise to be able to easily control execution flow.

## getCurrentUser

Retrieve current user and save user schema to store.

Returned promise rejects with an error if there is no previously authenticated user:

```
{
  message: "Can't retrieve current user",
}
```

## authenticateUser

Authenticates a user with username and password.

Usage:

```
this.$store.dispatch('authenticateUser', {
  username: "bruce@wayne.com",
  password: "testbatmanpass"
});
```

Returned promise resolves with an object with `userConfirmationNecessary` flag:

```
this.$store.dispatch('signUp', { ... }).then(({ userConfirmationNecessary }) => { ... })
```

Returned promise rejects with the following error object:

```
{
  code: "NotAuthorizedException", // Amazon Cognito error code
  message: "..." // Error message returned from Amazon Cognito servers
}
```

## signUp

Creates user with the following payload:

```
{
  username: 'test',
  password: 'Qwerty123!',
  attributes: {
    email: 'test@test.com',
    name: 'MegaTest',
    phone_number: '+15553334444',
  }
}
```

You can change `username` to be any value, for example, an email address or UUID. It's important to know that Amazon Cognito doesn't allow changing username after signing up.

Usage:

```
this.$store.dispatch('signUp', { ... });
```

Returned promise resolves with an object with `userConfirmationNecessary` flag:

```
this.$store.dispatch('signUp', { ... }).then(({ userConfirmationNecessary }) => { ... })
```

Returned promise rejects with the following error object:

```
{
  code: "NotAuthorizedException", // Amazon Cognito error code
  message: "..." // Error message returned from Amazon Cognito servers
}
```

## confirmRegistration

Confirms user registration with username and code:

Usage:

```
this.$store.dispatch('confirmRegistration', {
  username: 'testusername',
  code: '123456'
});
```

Returned promise rejects with the following error object:

```
{
  code: "NotAuthorizedException", // Amazon Cognito error code
  message: "..." // Error message returned from Amazon Cognito servers
}
```

## resendConfirmationCode

Resends user confirmation code:

Usage:

```
this.$store.dispatch('resendConfirmationCode', {
  username: 'testusername'
});
```

Returned promise rejects with the following error object:

```
{
  code: "NotAuthorizedException", // Amazon Cognito error code
  message: "..." // Error message returned from Amazon Cognito servers
}
```

## forgotPassword

Starts forgot password flow:

Usage:

```
this.$store.dispatch('forgotPassword', {
  username: 'testusername'
});
```

Returned promise rejects with the following error object:

```
{
  code: "NotAuthorizedException", // Amazon Cognito error code
  message: "..." // Error message returned from Amazon Cognito servers
}
```

## confirmPassword

Sets a new password with the code received after calling forgotPassword action:

Usage:

```
this.$store.dispatch('confirmPassword', {
  username: 'testusername',
  code: '123456',
  newPassword: 'qwerty123'
});
```

Returned promise rejects with the following error object:

```
{
  code: "NotAuthorizedException", // Amazon Cognito error code
  message: "..." // Error message returned from Amazon Cognito servers
}
```

## changePassword

> Only for authenticated users

Changes user password:

Usage:

```
this.$store.dispatch('changePassword', {
  oldPassword: '123qwerty',
  newPassword: 'qwerty123'
});
```

Returned promise rejects with the following error object:

```
{
  code: "NotAuthorizedException", // Amazon Cognito error code
  message: "..." // Error message returned from Amazon Cognito servers
}
```

## updateAttributes

> Only for authenticated users

Updates user attributes. Payload is an object where key is an attribute name:

```
{
  email: 'value',
  phone_number: 'bruce@wayne.com',
  username: 'batman' // see documentation on Cognito attributes
}
```

Usage:

```
this.$store.dispatch('updateAttributes', {
  email: 'bruce@wayne.com',
  name: 'Bruce',
  phone_number: '+15551234567',
});
```

Returned promise rejects with the following error object:

```
{
  code: "NotAuthorizedException", // Amazon Cognito error code
  message: "..." // Error message returned from Amazon Cognito servers
}
```

## signOut

Removes user from the store (for example, `$store.cognito.user`) and Cognito session from Local Storage.

Returned promise rejects with an error if there is no previously authenticated user:

```
{
  message: "User is unauthenticated",
}
```

# Examples

Before checking examples, please copy `examples/config/cognito.example.js` to `examples/config/cognito.js` and add the correct AWS crendentials to it.

`npm start` command uses [node-foreman](https://github.com/strongloop/node-foreman) package to run both API and Vue.js front-end servers. 

``` bash
cd examples

# install dependencies
npm install

# serve API server and examples with hot reload at localhost
npm start
```

### UUID

Cognito's username could be anything: email, a randomly generated integer, UUID, etc. It cannot be changed later so it's wise to use something unique like UUID and use attributes to keep email addresses, phone numbers and other information.

For now, Cognito doesn't support some features like resending confirmation code using email attribute. It requires a username for that operation and it could be a problem if it's a generated UUID. We can potentially keep username in localStorage or a cookie but it can easily be lost if a user switches computers or browsers.

That's why we need a little API endpoint to convert an email address stored in `email` attribute to a username by using Cognito API. You can find an example server in `examples/servers/index.js`.

# Tests

``` bash
# run all tests
npm test
```

# Credits

- [Evgeny Zislis](https://github.com/kesor)
- [Anton Sekatski](https://github.com/antonsekatski)
