/** Shared order flow (frontend). Keep in sync with backend/utils/orderStatus.js */
export const ORDER_FLOW = [
  'enquiry_received',
  'quotation_sent',
  'confirmed',
  'order_received',
];

export const ORDER_STATUS_LABELS = {
  enquiry_received: 'Enquiry Received',
  quotation_sent: 'Quotation Sent',
  confirmed: 'Order Confirmed',
  order_received: 'Order Received',
  cancelled: 'Cancelled',
  pending: 'Enquiry Received',
  shipped: 'Order Received',
  delivered: 'Order Received',
  processing: 'Order Confirmed',
};

export function formatOrderStatus(status, opts = {}) {
  if (!status) return '';
  const forCustomer = opts.forCustomer === true || opts.audience === 'customer';
  if (forCustomer && (status === 'enquiry_received' || status === 'pending')) {
    return 'Enquiry Sent';
  }
  return ORDER_STATUS_LABELS[status] || String(status).replace(/_/g, ' ');
}

export function getNextOrderStatus(current) {
  const i = ORDER_FLOW.indexOf(current);
  if (i < 0 || i >= ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[i + 1];
}

export function canCancelOrderStatus(status) {
  return ['enquiry_received', 'quotation_sent', 'confirmed', 'pending'].includes(status);
}

export function getAllowedAdminStatuses(current, opts = {}) {
  if (!current || current === 'cancelled' || current === 'order_received' || current === 'delivered') {
    return { next: null, canCancel: false, options: current ? [current] : [] };
  }

  if (current === 'enquiry_received' || current === 'pending') {
    if (opts.quotationSent) {
      return {
        next: 'confirmed',
        canCancel: true,
        options: [current, 'confirmed', 'cancelled'],
      };
    }
    return {
      next: null,
      canCancel: true,
      options: [current, 'cancelled'],
      quotationRequired: true,
    };
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

export const FILTERABLE_ORDER_STATUSES = [
  'enquiry_received',
  'quotation_sent',
  'confirmed',
  'order_received',
  'cancelled',
];

export const GST_PERCENT_OPTIONS = [0, 5, 12, 18, 28];
