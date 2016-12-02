require("babel-register")({
  // This will override `node_modules` ignoring - you can alternatively pass
  // an array of strings to be explicitly matched or a regex / glob
  ignore: /node_modules\/(?!amazon-cognito-identity-js)/
});

require('./actions.test')
require('./mutations.test')
