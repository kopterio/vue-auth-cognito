import express from 'express';
import AWS from 'aws-sdk';
import bodyParser from 'body-parser';

const app = express();

// This allows sending API request to a server started on a different port using HTTP access control (CORS)
// You can omit it in your production environment if your API server is running on the same host
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Methods', 'GET,POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,Authorization,identityId,requestId');
  res.set('Access-Control-Allow-Origin', '*');

  next();
});

app.use((req, res, next) => {
  res.type('application/json; charset=utf-8');
  next();
});

// JSON body parsing
app.use(bodyParser.json());

const cognito = new AWS.CognitoIdentityServiceProvider({ apiVersion: '2016-04-19' });

app.get('/v1/aws/cognito/username', (req, res) => {
  cognito.listUsers({
    UserPoolId: process.env.USER_POOL_ID,
    AttributesToGet: ['email'],
    Filter: `email = '${req.query.email}'`,
  }, (err, data) => {
    if (err) {
      res.status(500).send({
        statusCode: 500,
      });
      return;
    }

    if (data.Users.length === 0) {
      res.status(404).send({
        statusCode: 404,
        message: 'User not found',
      });
      return;
    }

    res.status(200).send({
      username: data.Users[0].Username,
    });
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT);

console.log(`Server started at 127.0.0.1:${PORT}`);
