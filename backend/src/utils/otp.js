const crypto = require('crypto');

const OTP_TTL_MS = 10 * 60 * 1000; // email verification — 10 minutes
const RESET_OTP_TTL_MS = 2 * 60 * 1000; // password reset — 2 minutes

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

/** 4-digit code for forgot-password flow only. */
function generateResetOtp() {
  return String(crypto.randomInt(1000, 10000));
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

function otpExpiresAt(from = Date.now()) {
  return new Date(from + OTP_TTL_MS);
}

function resetOtpExpiresAt(from = Date.now()) {
  return new Date(from + RESET_OTP_TTL_MS);
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
  RESET_OTP_TTL_MS,
  generateOtp,
  generateResetOtp,
  hashOtp,
  otpExpiresAt,
  resetOtpExpiresAt,
  isOtpExpired,
  otpMatches,
};
