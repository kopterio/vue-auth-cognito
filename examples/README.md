# vue-auth-cognito

This small library serves as a wrapper of Amazon Cognito for Vuex.

# Actions for dispatch method

All actions return a promise to be able to easily control execution flow.

## getCurrentUser

Saves CognitoUser class to store as `$store.cognito.user`.

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
  email: 'test@test.com',
  name: 'MegaTest',
  phone_number: '+15553334444',
}
```

You can change `username` to be an email address.

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

Updates user attributes. Payload is a list of CognitoUserAttribute classes from 'amazon-cognito-identity-js/src/CognitoUserAttribute'.

Usage:

```
this.$store.dispatch('updateAttributes', [
  new CognitoUserAttribute({ Name: 'email', Value: 'bruce@wayne.com' }),
  new CognitoUserAttribute({ Name: 'name', Value: 'Richard' }),
  new CognitoUserAttribute({ Name: 'phone_number', Value: '+15551234567' }),
]);
```

Returned promise rejects with the following error object:

```
{
  code: "NotAuthorizedException", // Amazon Cognito error code
  message: "..." // Error message returned from Amazon Cognito servers
}
```

## signOut

Removes user from the store (`$store.cognito.user`) and Cognito session from Local Storage.

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
