const env = require('../config/env');
const { formatProductTitle } = require('./productTitle');

const BRAND = {
  navy: '#1a4b8c',
  navyDark: '#143a6e',
  cyan: '#78c6d4',
  ink: '#0f172a',
  muted: '#64748b',
  line: '#e2e8f0',
  soft: '#f0f7fb',
  white: '#ffffff',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function siteUrl(path = '/') {
  const base = String(env.frontendUrl || 'https://marinekart.com').replace(/\/$/, '');
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function ctaButton(href, label) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 22px;background:${BRAND.navy};color:${BRAND.white};text-decoration:none;font-size:14px;font-weight:700;border-radius:10px;letter-spacing:0.01em;">${escapeHtml(label)}</a>`;
}

function metaRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid ${BRAND.line};width:34%;font-size:12px;font-weight:700;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.04em;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;border-bottom:1px solid ${BRAND.line};font-size:14px;color:${BRAND.ink};vertical-align:top;">${value}</td>
  </tr>`;
}

function wrapEmail({ title, eyebrow, bodyHtml, preheader = '' }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.soft};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.soft};padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.white};border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(26,75,140,0.12);border:1px solid #dbe7f2;">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyDark} 55%,#0f172a 100%);padding:22px 28px;">
              <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.cyan};">MarineKart</p>
              <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:${BRAND.white};letter-spacing:-0.02em;">${escapeHtml(title)}</p>
              ${eyebrow ? `<p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.72);">${escapeHtml(eyebrow)}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${BRAND.cyan},${BRAND.navy},${BRAND.cyan});font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;font-size:14px;line-height:1.65;color:#334155;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.soft};border-radius:12px;border:1px solid ${BRAND.line};">
                <tr>
                  <td style="padding:14px 16px;font-size:12px;line-height:1.55;color:${BRAND.muted};">
                    Need help? Reply is not monitored on this address.<br />
                    Visit <a href="${escapeHtml(siteUrl('/'))}" style="color:${BRAND.navy};font-weight:600;text-decoration:none;">marinekart.com</a>
                    · © ${year} MarineKart
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function otpBox(code) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    <tr>
      <td align="center" style="background:${BRAND.soft};border:1px dashed ${BRAND.cyan};border-radius:14px;padding:18px 12px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};">Your code</p>
        <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:0.35em;color:${BRAND.navy};font-family:Consolas,Monaco,monospace;">${escapeHtml(code)}</p>
      </td>
    </tr>
  </table>`;
}

function verificationOtpEmail({ name, code }) {
  const safeName = escapeHtml(name || 'there');
  return {
    subject: 'Your MarineKart verification code',
    html: wrapEmail({
      title: 'Verify your email',
      eyebrow: 'Almost there — confirm your account',
      preheader: `Your MarineKart verification code is ${code}`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">Thanks for registering with MarineKart. Enter this code to verify your email. It expires in <strong>10 minutes</strong>.</p>
        ${otpBox(code)}
        <p style="margin:0;color:${BRAND.muted};font-size:13px;">If you did not create this account, you can safely ignore this email.</p>
      `,
    }),
    text: `Hi ${name || 'there'},\n\nYour MarineKart verification code is ${code}. It expires in 10 minutes.\n\nIf you did not register, ignore this email.`,
  };
}

function passwordResetOtpEmail({ name, code }) {
  const safeName = escapeHtml(name || 'there');
  return {
    subject: 'Your MarineKart password reset code',
    html: wrapEmail({
      title: 'Reset your password',
      eyebrow: 'Security code for your account',
      preheader: `Your MarineKart password reset code is ${code}`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">We received a request to reset your MarineKart password. Use this code to continue. It expires in <strong>2 minutes</strong>.</p>
        ${otpBox(code)}
        <p style="margin:0;color:${BRAND.muted};font-size:13px;">If you did not request a password reset, you can ignore this email — your password will stay the same.</p>
      `,
    }),
    text: `Hi ${name || 'there'},\n\nYour MarineKart password reset code is ${code}. It expires in 2 minutes.\n\nIf you did not request this, ignore this email.`,
  };
}

function welcomeEmail({ name, loginUrl, accountType }) {
  const safeName = escapeHtml(name || 'there');
  const typeLabel =
    accountType === 'corporate'
      ? 'corporate customer'
      : accountType === 'admin'
        ? 'admin'
        : 'customer';
  const href = loginUrl || siteUrl('/login');
  return {
    subject: 'Welcome to MarineKart',
    html: wrapEmail({
      title: 'Welcome aboard',
      eyebrow: 'Your account is verified and ready',
      preheader: 'Welcome to MarineKart — your account is ready.',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 18px;">Thank you for joining MarineKart. Your <strong>${escapeHtml(typeLabel)}</strong> account is verified — browse marine hardware, unlock pricing, and checkout with ease.</p>
        <p style="margin:0 0 22px;">${ctaButton(href, 'Sign in to MarineKart')}</p>
        <p style="margin:0;color:${BRAND.muted};font-size:12px;">Or open: ${escapeHtml(href)}</p>
      `,
    }),
    text: `Hi ${name || 'there'},\n\nThank you for registering with MarineKart. Your ${typeLabel} account is verified.\n\nSign in: ${href}`,
  };
}

function accountTypeLabel(role) {
  const r = role === 'dealer' ? 'corporate' : role;
  if (r === 'corporate') return 'Corporate customer';
  if (r === 'admin') return 'Admin';
  return 'Normal customer';
}

function adminNewUserEmail({ user }) {
  const name = escapeHtml(`${user.firstName || ''} ${user.lastName || ''}`.trim() || '—');
  const email = escapeHtml(user.email || '—');
  const phone = escapeHtml(user.phone || '—');
  const typeLabel = accountTypeLabel(user.role);
  const typeSafe = escapeHtml(typeLabel);
  const company = user.companyName
    ? metaRow('Company', escapeHtml(user.companyName))
    : '';
  return {
    subject: `New ${typeLabel} registration — MarineKart`,
    html: wrapEmail({
      title: 'New registration',
      eyebrow: 'A new user joined the storefront',
      preheader: `New ${typeLabel}: ${user.email}`,
      bodyHtml: `
        <p style="margin:0 0 16px;">A new account was created on MarineKart.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${metaRow('Name', name)}
          ${metaRow('Email', email)}
          ${metaRow('Mobile', phone)}
          ${metaRow('Account type', typeSafe)}
          ${company}
        </table>
      `,
    }),
    text: `New MarineKart registration\n\nName: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nMobile: ${user.phone}\nAccount type: ${typeLabel}${user.companyName ? `\nCompany: ${user.companyName}` : ''}`,
  };
}

function formatWhen(date = new Date()) {
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Admin: new storefront user verified email and awaits approval */
function adminPendingApprovalEmail({ user }) {
  const name = escapeHtml(`${user.firstName || ''} ${user.lastName || ''}`.trim() || '—');
  const email = escapeHtml(user.email || '—');
  const phone = escapeHtml(user.phone || '—');
  const typeLabel = accountTypeLabel(user.role);
  const typeSafe = escapeHtml(typeLabel);
  const when = escapeHtml(formatWhen(user.emailVerified ? new Date() : user.createdAt || new Date()));
  const company = user.companyName
    ? metaRow('Company', escapeHtml(user.companyName))
    : '';
  const approvalsUrl = siteUrl('/admin/approvals');
  return {
    subject: `Approval needed — ${typeLabel} · MarineKart`,
    html: wrapEmail({
      title: 'Approval request',
      eyebrow: 'Email verified — review and approve',
      preheader: `${user.firstName || 'A customer'} is awaiting account approval`,
      bodyHtml: `
        <p style="margin:0 0 16px;">A new account has verified their email and is waiting for your approval before they can sign in.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;">
          ${metaRow('Name', name)}
          ${metaRow('Email', email)}
          ${metaRow('Mobile', phone)}
          ${metaRow('Account type', typeSafe)}
          ${metaRow('Submitted', when)}
          ${company}
        </table>
        <p style="margin:0 0 22px;">${ctaButton(approvalsUrl, 'Review approvals')}</p>
        <p style="margin:0;color:${BRAND.muted};font-size:12px;">Or open: ${escapeHtml(approvalsUrl)}</p>
      `,
    }),
    text: `Approval request — MarineKart\n\nName: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nMobile: ${user.phone}\nAccount type: ${typeLabel}\nSubmitted: ${formatWhen()}${user.companyName ? `\nCompany: ${user.companyName}` : ''}\n\nReview: ${approvalsUrl}`,
  };
}

/** Customer/corporate: email OTP verified — awaiting admin approval */
function emailVerifiedPendingApprovalEmail({ name, accountType, email }) {
  const safeName = escapeHtml(name || 'there');
  const isCorporate = accountType === 'corporate' || accountType === 'dealer';
  const typeLabel = isCorporate ? 'corporate customer' : 'customer';
  const typeSafe = escapeHtml(typeLabel);
  const safeEmail = escapeHtml(email || '');
  return {
    subject: 'Email verified — your MarineKart account is under review',
    html: wrapEmail({
      title: 'Email verified',
      eyebrow: 'Application sent for admin approval',
      preheader:
        'Your email is verified. Your MarineKart account is under review — login details will follow after approval.',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">Thank you for verifying your email. Your <strong>${typeSafe}</strong> account registration with MarineKart has been received successfully.</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:rgba(120,198,212,0.15);border:1px solid ${BRAND.cyan};">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Current status</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${BRAND.navy};">Pending admin approval</p>
        </div>
        <p style="margin:0 0 12px;">What happens next:</p>
        <ul style="margin:0 0 18px;padding-left:18px;color:${BRAND.ink};font-size:14px;line-height:1.6;">
          <li style="margin-bottom:6px;">Our team will review your ${typeSafe} application.</li>
          <li style="margin-bottom:6px;">Once approved, you will receive an email with your <strong>login credentials</strong>.</li>
          <li>You will then be able to sign in and start using MarineKart.</li>
        </ul>
        ${
          safeEmail
            ? `<p style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;">Registered email: <strong style="color:${BRAND.ink};">${safeEmail}</strong></p>`
            : ''
        }
        <p style="margin:0;color:${BRAND.muted};font-size:13px;">No further action is required from you at this time. If you have questions, reply to this email or contact MarineKart support.</p>
      `,
    }),
    text: `Hi ${name || 'there'},

Thank you for verifying your email. Your ${typeLabel} account registration with MarineKart has been received successfully.

Current status: Pending admin approval

What happens next:
• Our team will review your ${typeLabel} application.
• Once approved, you will receive an email with your login credentials.
• You will then be able to sign in and start using MarineKart.
${email ? `\nRegistered email: ${email}\n` : ''}
No further action is required from you at this time.

— MarineKart`,
  };
}

/** Customer: admin approved their account — includes login credentials */
function accountApprovedEmail({ name, email, password, loginUrl, accountType }) {
  const safeName = escapeHtml(name || 'there');
  const safeEmail = escapeHtml(email || '');
  const safePassword = escapeHtml(password || '');
  const typeLabel =
    accountType === 'corporate' ? 'corporate customer' : 'customer';
  const href = loginUrl || siteUrl('/login');
  return {
    subject: 'Welcome to MarineKart — your account has been approved',
    html: wrapEmail({
      title: 'Welcome aboard',
      eyebrow: 'Your application has been approved',
      preheader: `Welcome ${name || 'Customer'} — your MarineKart account is approved. Sign-in details inside.`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Welcome ${safeName},</p>
        <p style="margin:0 0 16px;">Hi — your <strong>${escapeHtml(typeLabel)}</strong> account on MarineKart is now <strong>approved</strong> and ready to use.</p>
        <p style="margin:0 0 16px;">You can sign in to browse our marine hardware catalog, manage your wishlist, and send product enquiries.</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:rgba(120,198,212,0.15);border:1px solid ${BRAND.cyan};">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Account status</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${BRAND.navy};">Active</p>
        </div>
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Your login details</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;background:${BRAND.soft};border:1px solid ${BRAND.line};border-radius:12px;overflow:hidden;">
          ${metaRow('Email', safeEmail)}
          ${metaRow('Temporary password', `<span style="font-family:Consolas,Monaco,monospace;font-weight:700;letter-spacing:0.04em;color:${BRAND.navy};">${safePassword}</span>`)}
        </table>
        <p style="margin:0 0 18px;color:${BRAND.muted};font-size:13px;">For your security, please sign in and change this password after your first login using <strong>Forgot password</strong> if you prefer a password of your own.</p>
        <p style="margin:0 0 22px;">${ctaButton(href, 'Sign in to MarineKart')}</p>
        <p style="margin:0;color:${BRAND.muted};font-size:13px;">Thank you for choosing MarineKart. We look forward to serving you.</p>
        <p style="margin:12px 0 0;color:${BRAND.muted};font-size:12px;">Or open: ${escapeHtml(href)}</p>
      `,
    }),
    text: `Welcome ${name || 'Customer'},

Your MarineKart ${typeLabel} account has been approved.

Login details:
Email: ${email || ''}
Temporary password: ${password || ''}

Sign in: ${href}

For security, consider changing your password after first login via Forgot password.

Thank you for choosing MarineKart.
— MarineKart`,
  };
}

/** Customer/corporate: admin rejected their account application */
function accountRejectedEmail({ name, accountType, reason, email }) {
  const safeName = escapeHtml(name || 'there');
  const isCorporate = accountType === 'corporate' || accountType === 'dealer';
  const typeLabel = isCorporate ? 'corporate customer' : 'customer';
  const typeSafe = escapeHtml(typeLabel);
  const safeReason = escapeHtml(reason || 'No reason provided.');
  const safeEmail = escapeHtml(email || '');
  return {
    subject: 'Update on your MarineKart account application',
    html: wrapEmail({
      title: 'Application not approved',
      eyebrow: 'Account registration update',
      preheader:
        'We are sorry — your MarineKart account application was not approved. Details inside.',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">Thank you for your interest in MarineKart. After reviewing your <strong>${typeSafe}</strong> account application, we are unable to approve it at this time.</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:rgba(244,63,94,0.08);border:1px solid #fecdd3;">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Account status</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#be123c;">Not approved</p>
        </div>
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Reason</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:${BRAND.soft};border:1px solid ${BRAND.line};color:${BRAND.ink};font-size:14px;line-height:1.55;">
          ${safeReason}
        </div>
        ${
          safeEmail
            ? `<p style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;">Registered email: <strong style="color:${BRAND.ink};">${safeEmail}</strong></p>`
            : ''
        }
        <p style="margin:0 0 12px;">We apologize for any inconvenience. If you believe this was a mistake or would like to discuss your application further, please contact MarineKart support and we will be happy to help.</p>
        <p style="margin:0;color:${BRAND.muted};font-size:13px;">Thank you for considering MarineKart.</p>
      `,
    }),
    text: `Hi ${name || 'there'},

Thank you for your interest in MarineKart. After reviewing your ${typeLabel} account application, we are unable to approve it at this time.

Account status: Not approved

Reason:
${reason || 'No reason provided.'}
${email ? `\nRegistered email: ${email}\n` : ''}
We apologize for any inconvenience. If you believe this was a mistake or would like to discuss your application further, please contact MarineKart support.

Thank you for considering MarineKart.
— MarineKart`,
  };
}

function adminNewOrderEmail({ order, customer, when }) {
  const name = escapeHtml(customer?.name || 'Customer');
  const email = escapeHtml(customer?.email || '—');
  const phone = escapeHtml(customer?.phone || '—');
  const orderNumber = escapeHtml(order.orderNumber || order._id);
  const whenSafe = escapeHtml(when);
  const addr = order.billingAddress || {};
  const addressLine = escapeHtml(
    [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ') || '—'
  );

  return {
    subject: `New enquiry ${order.orderNumber} — MarineKart`,
    html: wrapEmail({
      title: 'New enquiry received',
      eyebrow: `Enquiry ${order.orderNumber || ''}`,
      preheader: `New enquiry ${order.orderNumber} from ${customer?.name || 'customer'}`,
      bodyHtml: `
        <p style="margin:0 0 16px;">A customer just submitted an enquiry on MarineKart.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;">
          ${metaRow('Enquiry', orderNumber)}
          ${metaRow('Time', whenSafe)}
          ${metaRow('Customer', name)}
          ${metaRow('Email', email)}
          ${metaRow('Mobile', phone)}
          ${metaRow('Address', addressLine)}
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;background:${BRAND.soft};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.line};">
          <tr style="background:${BRAND.navy};">
            <th align="left" style="padding:10px 8px;color:${BRAND.white};font-weight:600;">Item</th>
            <th style="padding:10px 8px;color:${BRAND.white};font-weight:600;">Qty</th>
          </tr>
          ${(order.items || [])
            .map(
              (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};color:#334155;">${escapeHtml(formatProductTitle(item))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:center;color:#334155;">${escapeHtml(item.quantity)}</td>
      </tr>`
            )
            .join('')}
        </table>
      `,
    }),
    text: `New enquiry ${order.orderNumber}\nTime: ${when}\nCustomer: ${customer?.name}\nEmail: ${customer?.email}\nPhone: ${customer?.phone}`,
  };
}

function customerOrderStatusEmail({ order, customerName, status, when }) {
  const name = escapeHtml(customerName || 'there');
  const orderNumber = escapeHtml(order.orderNumber || '');
  const statusSafe = escapeHtml(status);
  const whenSafe = escapeHtml(when);
  const quoteTotal =
    order.quotation?.status === 'sent' && order.quotation?.grandTotal != null
      ? order.quotation.grandTotal
      : null;

  const rows = (order.items || [])
    .slice(0, 12)
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid ${BRAND.line};">${escapeHtml(formatProductTitle(item))}</td>
          <td style="padding:8px;border-bottom:1px solid ${BRAND.line};text-align:center;">×${escapeHtml(item.quantity)}</td>
        </tr>`
    )
    .join('');

  const totalRow =
    quoteTotal != null
      ? metaRow(
          'Quotation total',
          escapeHtml(`₹${Number(quoteTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`)
        )
      : '';

  return {
    subject: `Order ${order.orderNumber} — ${status}`,
    html: wrapEmail({
      title: 'Order update',
      eyebrow: `Status: ${status}`,
      preheader: `Order ${order.orderNumber} is now ${status}`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0 0 16px;">Your MarineKart enquiry / order status has been updated.</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:rgba(120,198,212,0.15);border:1px solid ${BRAND.cyan};">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Current status</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${BRAND.navy};">${statusSafe}</p>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
          ${metaRow('Enquiry / Order', orderNumber)}
          ${metaRow('Updated', whenSafe)}
          ${totalRow}
        </table>
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Items</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;border:1px solid ${BRAND.line};border-radius:12px;overflow:hidden;">
          ${rows}
        </table>
        <p style="margin:20px 0 0;">${ctaButton(siteUrl('/account/orders'), 'View my orders')}</p>
        <p style="margin:16px 0 0;color:${BRAND.muted};font-size:13px;">Thank you for choosing MarineKart.</p>
      `,
    }),
    text: `Hi ${customerName},\n\nOrder ${order.orderNumber} is now ${status}.\nUpdated: ${when}\n\n— MarineKart`,
  };
}

/** Customer: admin cancelled their enquiry/order */
function customerOrderCancelledEmail({ order, customerName, when, reason }) {
  const name = escapeHtml(customerName || 'there');
  const orderNumber = escapeHtml(order.orderNumber || '');
  const whenSafe = escapeHtml(when);
  const safeReason = escapeHtml(reason || 'No reason provided.');

  const rows = (order.items || [])
    .slice(0, 12)
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid ${BRAND.line};">${escapeHtml(formatProductTitle(item))}</td>
          <td style="padding:8px;border-bottom:1px solid ${BRAND.line};text-align:center;">×${escapeHtml(item.quantity)}</td>
        </tr>`
    )
    .join('');

  return {
    subject: `Enquiry ${order.orderNumber} cancelled — MarineKart`,
    html: wrapEmail({
      title: 'Enquiry cancelled',
      eyebrow: 'We are sorry for the inconvenience',
      preheader: `Your MarineKart enquiry ${order.orderNumber} has been cancelled.`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0 0 16px;">We are sorry to let you know that your MarineKart enquiry has been <strong>cancelled</strong>. We apologize for any inconvenience this may cause.</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:rgba(244,63,94,0.08);border:1px solid #fecdd3;">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Current status</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#be123c;">Cancelled</p>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
          ${metaRow('Enquiry / Order', orderNumber)}
          ${metaRow('Cancelled on', whenSafe)}
        </table>
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Cancellation reason</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:${BRAND.soft};border:1px solid ${BRAND.line};color:${BRAND.ink};font-size:14px;line-height:1.55;">
          ${safeReason}
        </div>
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Items</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;border:1px solid ${BRAND.line};border-radius:12px;overflow:hidden;margin-bottom:18px;">
          ${rows || `<tr><td style="padding:12px;color:${BRAND.muted};">No items listed</td></tr>`}
        </table>
        <p style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;">If you have questions about this cancellation or would like to place a new enquiry, please reply to this email or contact MarineKart support — we are happy to help.</p>
        <p style="margin:0 0 16px;">${ctaButton(siteUrl('/account/orders'), 'View my orders')}</p>
        <p style="margin:0;color:${BRAND.muted};font-size:13px;">Thank you for considering MarineKart.</p>
      `,
    }),
    text: `Hi ${customerName || 'there'},

We are sorry to let you know that your MarineKart enquiry has been cancelled. We apologize for any inconvenience this may cause.

Enquiry / Order: ${order.orderNumber || ''}
Cancelled on: ${when || ''}

Cancellation reason:
${reason || 'No reason provided.'}

If you have questions, please contact MarineKart support.

— MarineKart`,
  };
}

function customerQuotationSentEmail({ order, customerName, when }) {
  const name = escapeHtml(customerName || 'there');
  const orderNumber = escapeHtml(order.orderNumber || '');
  const whenSafe = escapeHtml(when);
  const q = order.quotation || {};
  const money = (n) =>
    `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return {
    subject: `Quotation created — ${order.orderNumber} — MarineKart`,
    html: wrapEmail({
      title: 'Quotation created',
      eyebrow: `Enquiry ${order.orderNumber || ''}`,
      preheader: `Your quotation PDF for ${order.orderNumber} is attached · Total ${money(q.grandTotal)}`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0 0 16px;">Your quotation has been created for your MarineKart enquiry. Please find the full quotation details in the <strong>PDF attachment</strong> with this email.</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:rgba(120,198,212,0.15);border:1px solid ${BRAND.cyan};">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Current status</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${BRAND.navy};">Quotation Sent</p>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;">
          ${metaRow('Enquiry', orderNumber)}
          ${metaRow('Created', whenSafe)}
          ${metaRow('Grand total', escapeHtml(money(q.grandTotal)))}
        </table>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:${BRAND.soft};border:1px solid ${BRAND.line};">
          <p style="margin:0;font-size:13px;color:#334155;line-height:1.55;">
            📎 <strong>Attachment:</strong> Quotation PDF with item-wise amounts, taxes, terms &amp; bank details.
          </p>
        </div>
        <p style="margin:20px 0 0;">${ctaButton(siteUrl('/account/orders'), 'View my enquiry')}</p>
        <p style="margin:16px 0 0;color:${BRAND.muted};font-size:13px;">If you have questions about this quotation, reply to this email or contact MarineKart support.</p>
      `,
    }),
    text: `Hi ${customerName || 'there'},

Quotation created for ${order.orderNumber}.
Status: Quotation Sent
Created: ${when}
Grand total: ${money(q.grandTotal)}

Please open the attached PDF for full quotation details (items, charges, terms & bank details).

View: ${siteUrl('/account/orders')}

— MarineKart`,
  };
}

function adminNewEnquiryEmail({ name, email, subject, message }) {
  const safeName = escapeHtml(name || '—');
  const safeEmail = escapeHtml(email || '—');
  const safeSubject = escapeHtml(subject || 'General enquiry');
  const safeMessage = escapeHtml(message || '').replace(/\n/g, '<br />');
  return {
    subject: `New enquiry — ${subject || 'MarineKart'}`,
    html: wrapEmail({
      title: 'New enquiry',
      eyebrow: 'Contact form submission',
      preheader: `Enquiry from ${name || 'visitor'}: ${subject || 'General'}`,
      bodyHtml: `
        <p style="margin:0 0 16px;">A new enquiry was submitted from the Contact Us form.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
          ${metaRow('Name', safeName)}
          ${metaRow('Email', safeEmail)}
          ${metaRow('Subject', safeSubject)}
        </table>
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Message</p>
        <div style="padding:14px 16px;background:${BRAND.soft};border:1px solid ${BRAND.line};border-radius:12px;color:#334155;line-height:1.65;">${safeMessage}</div>
      `,
    }),
    text: `New enquiry\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject || 'General enquiry'}\n\n${message}`,
  };
}

function enquiryThankYouEmail({ name }) {
  const safeName = escapeHtml(name || 'there');
  return {
    subject: 'Thank you for your enquiry — MarineKart',
    html: wrapEmail({
      title: 'We received your message',
      eyebrow: 'Thanks for contacting MarineKart',
      preheader: 'Thank you for your enquiry — we will connect with you shortly.',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">Thank you for making an enquiry with MarineKart. Our team has received your message and will connect with you shortly.</p>
        <p style="margin:0 0 20px;color:${BRAND.muted};font-size:13px;">We typically respond as soon as possible during business hours.</p>
        <p style="margin:0;">${ctaButton(siteUrl('/shop'), 'Continue shopping')}</p>
      `,
    }),
    text: `Hi ${name || 'there'},\n\nThank you for making an enquiry with MarineKart. We have received your message and will connect with you shortly.\n\n— MarineKart`,
  };
}

function otherProductThankYouEmail({ name, productName }) {
  const safeName = escapeHtml(name || 'there');
  const safeProduct = escapeHtml(productName || 'your product');
  return {
    subject: 'Product enquiry received — MarineKart',
    html: wrapEmail({
      title: 'Enquiry received',
      eyebrow: 'Product not listed',
      preheader: `We received your enquiry for ${productName || 'a product'}.`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">Thank you for submitting an enquiry for <strong>${safeProduct}</strong>. Our sourcing team will review your request and contact you shortly.</p>
        <p style="margin:0;">${ctaButton(siteUrl('/shop'), 'Browse catalog')}</p>
      `,
    }),
    text: `Hi ${name || 'there'},\n\nThank you for your product enquiry (${productName}). We will contact you shortly.\n\n— MarineKart`,
  };
}

function adminOtherProductEmail({
  customerName,
  email,
  phone,
  productName,
  categoryName,
  subcategoryName,
  description,
  quantity,
  address,
  deliveryAddress,
  imageCount,
  when,
}) {
  const addr = deliveryAddress || {};
  const addressLine = escapeHtml(
    [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ') ||
      address ||
      '—'
  );
  const whenSafe = escapeHtml(when || new Date().toLocaleString('en-IN'));

  return {
    subject: `Other product enquiry — ${productName || 'MarineKart'}`,
    html: wrapEmail({
      title: 'Other product enquiry',
      eyebrow: 'Product not listed',
      preheader: `${customerName || 'Customer'} enquired about ${productName || 'a product'}`,
      bodyHtml: `
        <p style="margin:0 0 16px;">A logged-in customer submitted a product-not-listed enquiry.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;">
          ${metaRow('Time', whenSafe)}
          ${metaRow('Customer', escapeHtml(customerName || '—'))}
          ${metaRow('Email', escapeHtml(email || '—'))}
          ${metaRow('Mobile', escapeHtml(phone || '—'))}
          ${metaRow('Product', escapeHtml(productName || '—'))}
          ${metaRow('Category', escapeHtml(categoryName || '—'))}
          ${metaRow('Subcategory', escapeHtml(subcategoryName || '—'))}
          ${metaRow('Quantity', escapeHtml(String(quantity || 1)))}
          ${metaRow('Reference images', escapeHtml(String(imageCount || 0)))}
          ${metaRow('Address', addressLine)}
        </table>
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Description</p>
        <div style="padding:14px 16px;background:${BRAND.soft};border:1px solid ${BRAND.line};border-radius:12px;color:#334155;line-height:1.65;margin-bottom:20px;">${escapeHtml(description || '').replace(/\n/g, '<br />')}</div>
        <p style="margin:0;">${ctaButton(siteUrl('/admin/other-products'), 'View in admin')}</p>
      `,
    }),
    text: `Other product enquiry\n\nTime: ${when || ''}\nCustomer: ${customerName}\nEmail: ${email}\nPhone: ${phone}\nProduct: ${productName}\nCategory: ${categoryName}\nSubcategory: ${subcategoryName}\nQty: ${quantity}\nAddress: ${address}\n\n${description}`,
  };
}

module.exports = {
  verificationOtpEmail,
  passwordResetOtpEmail,
  welcomeEmail,
  adminNewUserEmail,
  adminPendingApprovalEmail,
  emailVerifiedPendingApprovalEmail,
  accountApprovedEmail,
  accountRejectedEmail,
  adminNewOrderEmail,
  customerOrderStatusEmail,
  customerOrderCancelledEmail,
  customerQuotationSentEmail,
  adminNewEnquiryEmail,
  enquiryThankYouEmail,
  adminOtherProductEmail,
  otherProductThankYouEmail,
};
