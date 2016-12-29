# vue-auth-cognito

[![Build Status](https://travis-ci.org/kopterio/vue-auth-cognito.svg?branch=master)](https://travis-ci.org/kopterio/vue-auth-cognito)
[![Code Climate](https://codeclimate.com/github/kopterio/vue-auth-cognito/badges/gpa.svg)](https://codeclimate.com/github/kopterio/vue-auth-cognito)
[![Coverage Status](https://coveralls.io/repos/github/kopterio/vue-auth-cognito/badge.svg?branch=master)](https://coveralls.io/github/kopterio/vue-auth-cognito?branch=master)

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

# Build Setup

``` bash
# install dependencies
npm install

# serve examples with hot reload at localhost:8080
npm run dev

# run all tests
npm test
```

# Credits

- [Evgeny Zislis](https://github.com/kesor)
- [Anton Sekatski](https://github.com/antonsekatski)
