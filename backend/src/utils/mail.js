const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.email || !env.emailPassword) {
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.email,
      pass: env.emailPassword,
    },
  });
  return transporter;
}

/**
 * Send an email. Returns { ok, skipped?, error? }.
 * Never throws — callers can continue even if mail fails.
 */
async function sendMail({ to, subject, html, text, attachments }) {
  const tx = getTransporter();
  if (!tx) {
    console.warn('[mail] Skipped — EMAIL / EMAIL_PASSWORD not configured.');
    return { ok: false, skipped: true };
  }

  const recipients = Array.isArray(to) ? to : [to];
  const unique = [...new Set(recipients.map((e) => String(e || '').trim().toLowerCase()).filter(Boolean))];
  if (!unique.length) {
    return { ok: false, skipped: true };
  }

  try {
    const payload = {
      from: `"MarineKart" <${env.email}>`,
      to: unique.join(', '),
      subject,
      html,
      text,
    };
    if (Array.isArray(attachments) && attachments.length) {
      payload.attachments = attachments;
    }
    await tx.sendMail(payload);
    return { ok: true, sentTo: unique };
  } catch (err) {
    console.error('[mail] Failed:', err.message);
    return { ok: false, error: err.message };
  }
}

/** Email every active admin user in the DB. Falls back to EMAIL env if none found. */
async function sendMailToAdmins({ subject, html, text }) {
  const User = require('../models/User');
  let emails = [];
  try {
    const admins = await User.find({
      role: 'admin',
      isActive: true,
      isDeleted: { $ne: true },
    }).select('email');
    emails = admins.map((a) => a.email).filter(Boolean);
  } catch (err) {
    console.error('[mail] Could not load admins:', err.message);
  }

  const unique = [...new Set(emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
  if (!unique.length && env.email) {
    unique.push(String(env.email).trim().toLowerCase());
  }
  if (!unique.length) {
    console.warn('[mail] No admin emails to notify.');
    return { ok: false, skipped: true };
  }

  return sendMail({ to: unique, subject, html, text });
}

module.exports = { sendMail, sendMailToAdmins };
