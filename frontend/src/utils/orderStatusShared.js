/** Shared order flow steps (frontend). Keep in sync with backend/utils/orderStatus.js */
export const ORDER_FLOW = [
  'pending',
  'quotation_sent',
  'confirmed',
  'shipped',
  'delivered',
];

export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  quotation_sent: 'Quotation Sent',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  processing: 'Processing',
};

export function formatOrderStatus(status) {
  if (!status) return '';
  return ORDER_STATUS_LABELS[status] || String(status).replace(/_/g, ' ');
}

export function getNextOrderStatus(current) {
  const i = ORDER_FLOW.indexOf(current);
  if (i < 0 || i >= ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[i + 1];
}

export function canCancelOrderStatus(status) {
  return ['pending', 'quotation_sent', 'confirmed'].includes(status);
}

export function getAllowedAdminStatuses(current) {
  if (!current || current === 'cancelled' || current === 'delivered') {
    return { next: null, canCancel: false, options: current ? [current] : [] };
  }
  if (current === 'shipped') {
    return { next: 'delivered', canCancel: false, options: ['shipped', 'delivered'] };
  }
  const next = getNextOrderStatus(current);
  const options = [current];
  if (next) options.push(next);
  const canCancel = canCancelOrderStatus(current);
  if (canCancel) options.push('cancelled');
  return { next, canCancel, options };
}

export function canCustomerCancel(status) {
  return canCancelOrderStatus(status);
}
