const crypto = require('crypto');

/**
 * Generate a strong random password for new accounts (emailed on admin approval).
 * Mix of upper, lower, digits, and a symbol — easy enough to type from email.
 */
function generateStrongPassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;

  const pick = (set) => set[crypto.randomInt(0, set.length)];

  // Ensure at least one of each class
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const remaining = Math.max(4, length - chars.length);
  for (let i = 0; i < remaining; i += 1) {
    chars.push(pick(all));
  }

  // Shuffle
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Temporary password at registration — replaced when admin approves. */
function generatePlaceholderPassword() {
  return `tmp_${crypto.randomBytes(24).toString('base64url')}`;
}

module.exports = {
  generateStrongPassword,
  generatePlaceholderPassword,
};
