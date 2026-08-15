const env = require('../config/env');

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

/** Customer: admin approved their account */
function accountApprovedEmail({ name, loginUrl, accountType }) {
  const safeName = escapeHtml(name || 'there');
  const typeLabel =
    accountType === 'corporate' ? 'corporate customer' : 'customer';
  const href = loginUrl || siteUrl('/login');
  return {
    subject: 'Your MarineKart account has been approved',
    html: wrapEmail({
      title: 'Account approved',
      eyebrow: 'You can sign in now',
      preheader: 'Your MarineKart account has been approved — you can sign in.',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">Good news — your <strong>${escapeHtml(typeLabel)}</strong> account has been approved by our team. You can now sign in to browse products, view pricing, and place orders.</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:rgba(120,198,212,0.15);border:1px solid ${BRAND.cyan};">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Status</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${BRAND.navy};">Approved</p>
        </div>
        <p style="margin:0 0 22px;">${ctaButton(href, 'Sign in to MarineKart')}</p>
        <p style="margin:0;color:${BRAND.muted};font-size:13px;">Welcome aboard — we look forward to serving you.</p>
        <p style="margin:12px 0 0;color:${BRAND.muted};font-size:12px;">Or open: ${escapeHtml(href)}</p>
      `,
    }),
    text: `Hi ${name || 'there'},\n\nYour MarineKart ${typeLabel} account has been approved. You can now sign in.\n\nSign in: ${href}\n\n— MarineKart`,
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
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};color:#334155;">${escapeHtml(item.name)}</td>
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
          <td style="padding:8px;border-bottom:1px solid ${BRAND.line};">${escapeHtml(item.name)}</td>
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

function customerQuotationSentEmail({ order, customerName, when }) {
  const name = escapeHtml(customerName || 'there');
  const orderNumber = escapeHtml(order.orderNumber || '');
  const whenSafe = escapeHtml(when);
  const q = order.quotation || {};
  const addr = order.shippingAddress || order.billingAddress || {};
  const addressLine = escapeHtml(
    [addr.fullName, addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country]
      .filter(Boolean)
      .join(', ') || '—'
  );
  const money = (n) =>
    `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  const rows = (q.items || [])
    .map((item) => {
      const qty = Number(item.quantity) || 0;
      const amount = Number(item.amount) || 0;
      const itemPrice = Math.round(amount * qty * 100) / 100;
      let discAmt = 0;
      if (item.discountType === 'percent') {
        discAmt = Math.min(itemPrice, (itemPrice * Math.min(Number(item.discountValue) || 0, 100)) / 100);
      } else if (item.discountType === 'amount') {
        discAmt = Math.min(itemPrice, Number(item.discountValue) || 0);
      } else if (item.lineTotal != null && itemPrice > 0) {
        discAmt = Math.max(0, Math.round((itemPrice - Number(item.lineTotal || 0)) * 100) / 100);
      }
      discAmt = Math.round(discAmt * 100) / 100;
      const categoryBits = [item.categoryName, item.subcategoryName].filter(Boolean).join(' · ');
      const categoryHtml = categoryBits
        ? `<div style="margin-top:2px;font-size:11px;color:${BRAND.muted};">${escapeHtml(categoryBits)}</div>`
        : '';
      const skuHtml = item.sku
        ? `<div style="margin-top:2px;font-size:10px;font-family:Consolas,Monaco,monospace;color:#94a3b8;">${escapeHtml(item.sku)}</div>`
        : '';
      return `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};color:#334155;">
          <div style="font-weight:600;color:${BRAND.ink};">${escapeHtml(item.name)}</div>
          ${categoryHtml}
          ${skuHtml}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:center;color:#334155;">${escapeHtml(qty)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:right;color:#334155;">${escapeHtml(money(amount))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:right;color:${BRAND.ink};font-weight:600;">${escapeHtml(money(itemPrice))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.line};text-align:right;color:${BRAND.navy};font-weight:700;">${escapeHtml(money(Math.round((itemPrice - discAmt) * 100) / 100))}</td>
      </tr>`;
    })
    .join('');

  const textLines = (q.items || [])
    .map((item) => {
      const qty = Number(item.quantity) || 0;
      const amount = Number(item.amount) || 0;
      const itemPrice = Math.round(amount * qty * 100) / 100;
      let discAmt = 0;
      if (item.discountType === 'percent') {
        discAmt = Math.min(itemPrice, (itemPrice * Math.min(Number(item.discountValue) || 0, 100)) / 100);
      } else if (item.discountType === 'amount') {
        discAmt = Math.min(itemPrice, Number(item.discountValue) || 0);
      }
      discAmt = Math.round(discAmt * 100) / 100;
      const discountedPrice = Math.round((itemPrice - discAmt) * 100) / 100;
      return `- ${item.name} ×${qty} @ ${money(amount)} · Item price ${money(itemPrice)} · Discounted price ${money(discountedPrice)}`;
    })
    .join('\n');

  return {
    subject: `Quotation created — ${order.orderNumber} — MarineKart`,
    html: wrapEmail({
      title: 'Quotation created',
      eyebrow: `Enquiry ${order.orderNumber || ''}`,
      preheader: `Quotation created for ${order.orderNumber} · Total ${money(q.grandTotal)}`,
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0 0 16px;">Your quotation has been created for your MarineKart enquiry. Please review the details below.</p>
        <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:rgba(120,198,212,0.15);border:1px solid ${BRAND.cyan};">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.muted};">Current status</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:${BRAND.navy};">Quotation Sent</p>
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;">
          ${metaRow('Enquiry', orderNumber)}
          ${metaRow('Created', whenSafe)}
          ${metaRow('Delivery address', addressLine)}
        </table>
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.muted};">Quotation details</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;background:${BRAND.soft};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.line};">
          <tr style="background:${BRAND.navy};">
            <th align="left" style="padding:10px 8px;color:${BRAND.white};font-weight:600;">Item</th>
            <th style="padding:10px 8px;color:${BRAND.white};font-weight:600;">Qty</th>
            <th align="right" style="padding:10px 8px;color:${BRAND.white};font-weight:600;">Amount</th>
            <th align="right" style="padding:10px 8px;color:${BRAND.white};font-weight:600;">Item price</th>
            <th align="right" style="padding:10px 8px;color:${BRAND.white};font-weight:600;">Discounted price</th>
          </tr>
          ${rows}
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px;">
          ${metaRow(
            'Items subtotal',
            escapeHtml(money(Number(q.itemsSubtotal || 0) + Number(q.discountTotal || 0)))
          )}
          ${
            Number(q.discountTotal) > 0
              ? metaRow('Discount', escapeHtml(money(q.discountTotal)))
              : ''
          }
          ${metaRow('Courier charges', escapeHtml(money(q.courierCharges)))}
          ${metaRow(`GST (${q.gstPercent || 0}%)`, escapeHtml(money(q.gstAmount)))}
        </table>
        <div style="margin:16px 0 0;padding:14px 16px;border-radius:12px;background:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyDark} 100%);">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.7);">Grand total</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:${BRAND.white};letter-spacing:-0.02em;">${escapeHtml(money(q.grandTotal))}</p>
        </div>
        <p style="margin:20px 0 0;">${ctaButton(siteUrl('/account/orders'), 'View my enquiry')}</p>
        <p style="margin:16px 0 0;color:${BRAND.muted};font-size:13px;">If you have questions about this quotation, reply to this email or contact MarineKart support.</p>
      `,
    }),
    text: `Hi ${customerName || 'there'},

Quotation created for ${order.orderNumber}.
Status: Quotation Sent
Created: ${when}

Items:
${textLines}

Items subtotal: ${money(Number(q.itemsSubtotal || 0) + Number(q.discountTotal || 0))}
${Number(q.discountTotal) > 0 ? `Discount: ${money(q.discountTotal)}\n` : ''}Courier: ${money(q.courierCharges)}
GST (${q.gstPercent || 0}%): ${money(q.gstAmount)}
Grand total: ${money(q.grandTotal)}

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

module.exports = {
  verificationOtpEmail,
  passwordResetOtpEmail,
  welcomeEmail,
  adminNewUserEmail,
  adminPendingApprovalEmail,
  accountApprovedEmail,
  adminNewOrderEmail,
  customerOrderStatusEmail,
  customerQuotationSentEmail,
  adminNewEnquiryEmail,
  enquiryThankYouEmail,
};
