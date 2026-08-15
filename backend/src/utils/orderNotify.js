function formatWhen(date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString();
  }
}

function statusLabel(status, opts = {}) {
  const forCustomer = opts.forCustomer === true;
  if (forCustomer && (status === 'enquiry_received' || status === 'pending')) {
    return 'Enquiry Sent';
  }
  const map = {
    enquiry_received: 'Enquiry Received',
    quotation_sent: 'Quotation Sent',
    confirmed: 'Order Confirmed',
    order_received: 'Order Received',
    cancelled: 'Cancelled',
    pending: 'Enquiry Received',
    shipped: 'Order Received',
    delivered: 'Order Received',
  };
  return map[status] || String(status || '').replace(/_/g, ' ');
}

function customerDisplayName(user, billing) {
  if (billing?.fullName) return String(billing.fullName).trim();
  if (!user) return 'Customer';
  const n = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return n || user.companyName || user.email || 'Customer';
}

function formatMoney(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '—';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

module.exports = {
  formatWhen,
  statusLabel,
  customerDisplayName,
  formatMoney,
};
