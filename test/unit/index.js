require('babel-register')({
  // This will override `node_modules` ignoring - you can alternatively pass
  // an array of strings to be explicitly matched or a regex / glob
  ignore: /node_modules\/(?!amazon-cognito-identity-js)/,
});

require('./actions/authenticateUser.test');
require('./actions/changePassword.test');
require('./actions/confirmPassword.test');
require('./actions/confirmRegistraton.test');
require('./actions/forgotPassword.test');
require('./actions/getCurrentUser.test');
require('./actions/getUserAttributes.test');
require('./actions/resendConfirmationCode.test');
require('./actions/signOut.test');
require('./actions/signUp.test');
require('./actions/updateAttributes.test');

require('./mutations.test');
