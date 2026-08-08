const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

/**
 * Local / Render: connect DB and listen.
 * Vercel Services: export the Express app (no listen) — Fluid invokes it per request.
 */
const start = async () => {
  await connectDB();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`MarineKart API listening on port ${env.port}`);
    console.log(`CORS allowed origin: ${env.frontendUrl}`);
  });
};

if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = app;
