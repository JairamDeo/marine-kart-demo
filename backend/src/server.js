const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const start = async () => {
  await connectDB();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`MarineKart API listening on port ${env.port}`);
    console.log(`CORS allowed origin: ${env.frontendUrl}`);
  });
};

start();
