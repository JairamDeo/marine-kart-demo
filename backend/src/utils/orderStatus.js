/**
 * Enquiry / order workflow (admin):
 * enquiry_received → quotation_sent → confirmed → order_received
 *
 * Quotation Sent is set only by sending a quotation (not via status dropdown).
 * Cancel / reject allowed from: enquiry_received | quotation_sent | confirmed
 * NOT allowed from: order_received | cancelled
 */

const FLOW = ['enquiry_received', 'quotation_sent', 'confirmed', 'order_received'];

const STATUS_LABELS = {
  enquiry_received: 'Enquiry Received',
  quotation_sent: 'Quotation Sent',
  confirmed: 'Order Confirmed',
  order_received: 'Order Received',
  cancelled: 'Cancelled',
  // Legacy (migrated)
  pending: 'Enquiry Received',
  shipped: 'Order Received',
  delivered: 'Order Received',
  processing: 'Order Confirmed',
};

function formatStatus(status) {
  if (!status) return '';
  return STATUS_LABELS[status] || String(status).replace(/_/g, ' ');
}

function flowIndex(status) {
  return FLOW.indexOf(status);
}

function getNextStatus(current) {
  const i = flowIndex(current);
  if (i < 0 || i >= FLOW.length - 1) return null;
  return FLOW[i + 1];
}

function canCancelStatus(status) {
  return ['enquiry_received', 'quotation_sent', 'confirmed', 'pending'].includes(status);
}

/**
 * @param {string} current
 * @param {{ quotationSent?: boolean }} [opts]
 */
function getAllowedAdminStatuses(current, opts = {}) {
  if (!current || current === 'cancelled' || current === 'order_received' || current === 'delivered') {
    return { next: null, canCancel: false, options: [current].filter(Boolean) };
  }

  // Enquiry received: advance to Quotation Sent only via Create & Send Quotation
  if (current === 'enquiry_received' || current === 'pending') {
    const quotationSent = Boolean(opts.quotationSent);
    if (quotationSent) {
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

  const next = getNextStatus(current);
  const options = [current];
  if (next) options.push(next);
  const canCancel = canCancelStatus(current);
  if (canCancel) options.push('cancelled');
  return { next, canCancel, options };
}

/**
 * Validate admin status change (manual dropdown).
 * Sending a quotation uses a dedicated endpoint and may set quotation_sent directly.
 */
function validateAdminStatusChange(from, to, opts = {}) {
  if (!to || from === to) {
    return { ok: true, same: true };
  }
  if (from === 'cancelled') {
    return { ok: false, message: 'Cancelled orders cannot change status.' };
  }
  if (from === 'order_received' || from === 'delivered') {
    return { ok: false, message: 'Order Received is final and cannot be changed.' };
  }
  if (to === 'cancelled') {
    if (!canCancelStatus(from)) {
      return {
        ok: false,
        message: 'This order can no longer be cancelled.',
      };
    }
    return { ok: true, cancel: true };
  }

  // Manual advance to Quotation Sent is not allowed — use Create & Send Quotation
  if (to === 'quotation_sent') {
    return {
      ok: false,
      message: 'Use Create and Send Quotation to move this enquiry to Quotation Sent.',
    };
  }

  // If somehow still on enquiry but quotation already sent, allow jump to confirmed
  if (
    (from === 'enquiry_received' || from === 'pending') &&
    to === 'confirmed' &&
    opts.quotationSent
  ) {
    return { ok: true, next: true };
  }

  const next = getNextStatus(from === 'pending' ? 'enquiry_received' : from);
  if (!next) {
    return { ok: false, message: 'No further status updates are allowed.' };
  }
  if (to !== next) {
    return {
      ok: false,
      message: `Status must move one step at a time. Next allowed status is "${formatStatus(next)}".`,
    };
  }
  return { ok: true, next: true };
}

function canCustomerCancel(status) {
  return canCancelStatus(status);
}

module.exports = {
  FLOW,
  STATUS_LABELS,
  formatStatus,
  flowIndex,
  getNextStatus,
  canCancelStatus,
  getAllowedAdminStatuses,
  validateAdminStatusChange,
  canCustomerCancel,
};
