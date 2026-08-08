const crypto = require('crypto');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

function otpExpiresAt(from = Date.now()) {
  return new Date(from + OTP_TTL_MS);
}

function isOtpExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() < Date.now();
}

function otpMatches(plainCode, storedHash) {
  if (!plainCode || !storedHash) return false;
  const a = Buffer.from(hashOtp(plainCode));
  const b = Buffer.from(String(storedHash));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  OTP_TTL_MS,
  generateOtp,
  hashOtp,
  otpExpiresAt,
  isOtpExpired,
  otpMatches,
};
