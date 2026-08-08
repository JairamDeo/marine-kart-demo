/**
 * Order status workflow (admin):
 * pending → quotation_sent → confirmed → shipped → delivered
 *
 * Cancel allowed from: pending | quotation_sent | confirmed
 * NOT allowed from: shipped | delivered | cancelled
 *
 * Customer may cancel only before shipped (same as admin cancel window).
 */

const FLOW = ['pending', 'quotation_sent', 'confirmed', 'shipped', 'delivered'];

const STATUS_LABELS = {
  pending: 'Pending',
  quotation_sent: 'Quotation Sent',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  processing: 'Processing', // legacy (migrated away)
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
  return ['pending', 'quotation_sent', 'confirmed'].includes(status);
}

function getAllowedAdminStatuses(current) {
  if (!current || current === 'cancelled' || current === 'delivered') {
    return { next: null, canCancel: false, options: [current].filter(Boolean) };
  }
  if (current === 'shipped') {
    return { next: 'delivered', canCancel: false, options: ['shipped', 'delivered'] };
  }
  const next = getNextStatus(current);
  const options = [current];
  if (next) options.push(next);
  const canCancel = canCancelStatus(current);
  if (canCancel) options.push('cancelled');
  return { next, canCancel, options };
}

/**
 * Validate admin status change.
 * - Same status: ok (no-op)
 * - Forward exactly one step along FLOW
 * - Cancel only before shipped
 * - Never go backwards or skip steps
 */
function validateAdminStatusChange(from, to) {
  if (!to || from === to) {
    return { ok: true, same: true };
  }
  if (from === 'cancelled') {
    return { ok: false, message: 'Cancelled orders cannot change status.' };
  }
  if (from === 'delivered') {
    return { ok: false, message: 'Delivered orders are final and cannot be changed.' };
  }
  if (to === 'cancelled') {
    if (!canCancelStatus(from)) {
      return {
        ok: false,
        message: 'Orders cannot be cancelled after they have been shipped.',
      };
    }
    return { ok: true, cancel: true };
  }
  const next = getNextStatus(from);
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

/** Customer may cancel only before shipped. */
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
