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

function statusLabel(status) {
  const map = {
    pending: 'Pending',
    quotation_sent: 'Quotation sent',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
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
