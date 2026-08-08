const cors = require('cors');
const env = require('../config/env');

const isLocalhost = (origin = '') =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

function normalizeOrigin(origin = '') {
  return String(origin).trim().replace(/\/$/, '');
}

function allowedOriginSet() {
  const set = new Set();
  const add = (value) => {
    const n = normalizeOrigin(value);
    if (n) set.add(n);
  };
  add(env.frontendUrl);
  String(env.frontendUrls || '')
    .split(',')
    .forEach(add);
  return set;
}

function isVercelOrigin(origin) {
  try {
    const host = new URL(origin).hostname;
    return host === 'vercel.app' || host.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

const corsOptions = {
  origin(origin, callback) {
    // No origin = Postman / server-to-server / same-origin
    if (!origin) return callback(null, true);

    const normalized = normalizeOrigin(origin);
    const allowed = allowedOriginSet();

    if (allowed.has(normalized)) return callback(null, true);

    // Vercel production + preview deployments
    if (isVercelOrigin(origin)) return callback(null, true);

    // Local Vite ports in non-production
    if (env.nodeEnv !== 'production' && isLocalhost(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = cors(corsOptions);
