function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapEmail({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:28px 28px 12px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#111111;letter-spacing:-0.02em;">MarineKart</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;font-size:14px;line-height:1.6;color:#3f3f46;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa;">
              © MarineKart · Please do not reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function verificationOtpEmail({ name, code }) {
  const safeName = escapeHtml(name || 'there');
  const safeCode = escapeHtml(code);
  return {
    subject: 'Your MarineKart verification code',
    html: wrapEmail({
      title: 'Verify your email',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">Thanks for registering with MarineKart. Use this code to verify your email. It expires in <strong>10 minutes</strong>.</p>
        <p style="margin:0 0 8px;font-size:12px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">Verification code</p>
        <p style="margin:0 0 20px;font-size:28px;font-weight:700;letter-spacing:0.28em;color:#111111;">${safeCode}</p>
        <p style="margin:0;color:#71717a;font-size:13px;">If you did not create this account, you can ignore this email.</p>
      `,
    }),
    text: `Hi ${name || 'there'},\n\nYour MarineKart verification code is ${code}. It expires in 10 minutes.\n\nIf you did not register, ignore this email.`,
  };
}

function passwordResetOtpEmail({ name, code }) {
  const safeName = escapeHtml(name || 'there');
  const safeCode = escapeHtml(code);
  return {
    subject: 'Your MarineKart password reset code',
    html: wrapEmail({
      title: 'Reset your password',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">We received a request to reset your MarineKart password. Use this code to continue. It expires in <strong>2 minutes</strong>.</p>
        <p style="margin:0 0 8px;font-size:12px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">Reset code</p>
        <p style="margin:0 0 20px;font-size:28px;font-weight:700;letter-spacing:0.28em;color:#111111;">${safeCode}</p>
        <p style="margin:0;color:#71717a;font-size:13px;">If you did not request a password reset, you can ignore this email.</p>
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
        : 'normal customer';
  return {
    subject: 'Welcome to MarineKart',
    html: wrapEmail({
      title: 'Welcome',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">Thank you for registering with MarineKart. Your ${typeLabel} account is verified and ready to use.</p>
        <p style="margin:0 0 20px;">
          <a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:10px 16px;background:#1a4b8c;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;">Sign in</a>
        </p>
        <p style="margin:0;color:#71717a;font-size:13px;">Or open: ${escapeHtml(loginUrl)}</p>
      `,
    }),
    text: `Hi ${name || 'there'},\n\nThank you for registering with MarineKart. Your ${typeLabel} account is verified.\n\nSign in: ${loginUrl}`,
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
    ? `<p style="margin:0 0 6px;"><strong>Company:</strong> ${escapeHtml(user.companyName)}</p>`
    : '';
  return {
    subject: `New ${typeLabel} registration — MarineKart`,
    html: wrapEmail({
      title: 'New registration',
      bodyHtml: `
        <p style="margin:0 0 16px;">A new user has registered on MarineKart.</p>
        <p style="margin:0 0 6px;"><strong>Name:</strong> ${name}</p>
        <p style="margin:0 0 6px;"><strong>Email:</strong> ${email}</p>
        <p style="margin:0 0 6px;"><strong>Mobile:</strong> ${phone}</p>
        <p style="margin:0 0 6px;"><strong>Account type:</strong> ${typeSafe}</p>
        ${company}
      `,
    }),
    text: `New MarineKart registration\n\nName: ${user.firstName} ${user.lastName}\nEmail: ${user.email}\nMobile: ${user.phone}\nAccount type: ${typeLabel}${user.companyName ? `\nCompany: ${user.companyName}` : ''}`,
  };
}

module.exports = {
  verificationOtpEmail,
  passwordResetOtpEmail,
  welcomeEmail,
  adminNewUserEmail,
  adminNewOrderEmail,
  customerOrderStatusEmail,
  adminNewEnquiryEmail,
  enquiryThankYouEmail,
};

function adminNewOrderEmail({ order, customer, when }) {
  const name = escapeHtml(customer?.name || 'Customer');
  const email = escapeHtml(customer?.email || '—');
  const phone = escapeHtml(customer?.phone || '—');
  const orderNumber = escapeHtml(order.orderNumber || order._id);
  const whenSafe = escapeHtml(when);
  const total = escapeHtml(
    `₹${Number(order.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  );
  const addr = order.billingAddress || {};
  const addressLine = escapeHtml(
    [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ') || '—'
  );

  const rows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;color:#3f3f46;">${escapeHtml(item.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;text-align:center;color:#3f3f46;">${escapeHtml(item.quantity)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;text-align:right;color:#3f3f46;">₹${Number(item.totalPrice || 0).toLocaleString('en-IN')}</td>
      </tr>`
    )
    .join('');

  return {
    subject: `New order ${order.orderNumber} — MarineKart`,
    html: wrapEmail({
      title: 'New order',
      bodyHtml: `
        <p style="margin:0 0 12px;">A new order was placed.</p>
        <p style="margin:0 0 6px;"><strong>Order:</strong> ${orderNumber}</p>
        <p style="margin:0 0 6px;"><strong>Time:</strong> ${whenSafe}</p>
        <p style="margin:0 0 6px;"><strong>Customer:</strong> ${name}</p>
        <p style="margin:0 0 6px;"><strong>Email:</strong> ${email}</p>
        <p style="margin:0 0 6px;"><strong>Mobile:</strong> ${phone}</p>
        <p style="margin:0 0 16px;"><strong>Address:</strong> ${addressLine}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
          <tr>
            <th align="left" style="padding:0 0 8px;border-bottom:1px solid #e4e4e7;color:#71717a;font-weight:600;">Item</th>
            <th style="padding:0 0 8px;border-bottom:1px solid #e4e4e7;color:#71717a;font-weight:600;">Qty</th>
            <th align="right" style="padding:0 0 8px;border-bottom:1px solid #e4e4e7;color:#71717a;font-weight:600;">Total</th>
          </tr>
          ${rows}
        </table>
        <p style="margin:16px 0 0;"><strong>Order total:</strong> ${total}</p>
      `,
    }),
    text: `New order ${order.orderNumber}\nTime: ${when}\nCustomer: ${customer?.name}\nEmail: ${customer?.email}\nPhone: ${customer?.phone}\nTotal: ${order.total}`,
  };
}

function customerOrderStatusEmail({ order, customerName, status, when }) {
  const name = escapeHtml(customerName || 'there');
  const orderNumber = escapeHtml(order.orderNumber || '');
  const statusSafe = escapeHtml(status);
  const whenSafe = escapeHtml(when);
  const total = escapeHtml(
    `₹${Number(order.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
  );

  const rows = (order.items || [])
    .slice(0, 12)
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;">${escapeHtml(item.name)}</td>
          <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;text-align:center;">×${escapeHtml(item.quantity)}</td>
        </tr>`
    )
    .join('');

  return {
    subject: `Order ${order.orderNumber} — ${status}`,
    html: wrapEmail({
      title: 'Order update',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${name},</p>
        <p style="margin:0 0 16px;">Your MarineKart order status has been updated.</p>
        <p style="margin:0 0 6px;"><strong>Order:</strong> ${orderNumber}</p>
        <p style="margin:0 0 6px;"><strong>Status:</strong> ${statusSafe}</p>
        <p style="margin:0 0 6px;"><strong>Updated:</strong> ${whenSafe}</p>
        <p style="margin:0 0 16px;"><strong>Total:</strong> ${total}</p>
        <p style="margin:0 0 8px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">Items</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
          ${rows}
        </table>
        <p style="margin:16px 0 0;color:#71717a;font-size:13px;">Thank you for shopping with MarineKart.</p>
      `,
    }),
    text: `Hi ${customerName},\n\nOrder ${order.orderNumber} is now ${status}.\nUpdated: ${when}\nTotal: ${order.total}\n\n— MarineKart`,
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
      bodyHtml: `
        <p style="margin:0 0 16px;">A new enquiry was submitted from the Contact Us form.</p>
        <p style="margin:0 0 6px;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin:0 0 6px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0 0 6px;"><strong>Subject:</strong> ${safeSubject}</p>
        <p style="margin:16px 0 8px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">Message</p>
        <p style="margin:0;padding:12px 14px;background:#fafafa;border:1px solid #f4f4f5;color:#3f3f46;line-height:1.6;">${safeMessage}</p>
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
      title: 'Enquiry received',
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;">Thank you for making an enquiry with MarineKart. We have received your message and will connect with you shortly.</p>
        <p style="margin:0;color:#71717a;font-size:13px;">Our team typically responds as soon as possible during business hours.</p>
      `,
    }),
    text: `Hi ${name || 'there'},\n\nThank you for making an enquiry with MarineKart. We have received your message and will connect with you shortly.\n\n— MarineKart`,
  };
}
