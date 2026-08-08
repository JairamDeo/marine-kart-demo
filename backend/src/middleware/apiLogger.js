const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
let canWriteLogs = true;

try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch {
  canWriteLogs = false;
}

const getLogFileName = () => {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(logsDir, `api-${date}.log`);
};

/**
 * Logs every API call with method, URL, status, and response time (ms).
 * File logging is skipped on read-only hosts (e.g. Vercel).
 */
const apiLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      userId: req.user?._id?.toString() || null,
    };

    if (canWriteLogs) {
      const line = JSON.stringify(entry) + '\n';
      fs.appendFile(getLogFileName(), line, (err) => {
        if (err) {
          canWriteLogs = false;
          console.error('API logger write failed:', err.message);
        }
      });
    }

    if (envIsDev()) {
      const color = durationMs > 500 ? 'SLOW' : 'OK';
      console.log(
        `[${color}] ${entry.method} ${entry.url} → ${entry.status} (${entry.durationMs}ms)`
      );
    }
  });

  next();
};

const envIsDev = () => process.env.NODE_ENV !== 'production';

module.exports = apiLogger;
