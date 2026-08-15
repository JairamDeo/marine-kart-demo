import { ORDER_FLOW, formatOrderStatus } from '../../utils/orderStatusShared';

function formatWhen(at) {
  if (!at) return '';
  return new Date(at).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function historyFor(status, history = []) {
  const matches = history.filter((h) => h.status === status);
  return matches.length ? matches[matches.length - 1] : null;
}

/** Attractive order progress tracker — successful path only; cancel shown separately. */
export default function OrderTracker({ order, forCustomer = false }) {
  if (!order) return null;

  const history = order.statusHistory || [];
  const normalize = (s) => {
    if (s === 'pending') return 'enquiry_received';
    if (s === 'shipped' || s === 'delivered') return 'order_received';
    return s;
  };
  const current = normalize(order.orderStatus);
  const cancelled = current === 'cancelled';
  const cancelEntry = historyFor('cancelled', history);
  const stoppedAt =
    cancelled && cancelEntry?.fromStatus && ORDER_FLOW.includes(normalize(cancelEntry.fromStatus))
      ? normalize(cancelEntry.fromStatus)
      : null;
  const currentIdx = cancelled
    ? stoppedAt
      ? ORDER_FLOW.indexOf(stoppedAt)
      : -1
    : ORDER_FLOW.indexOf(current);

  return (
    <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-[#f7fafc] to-white px-3 py-3.5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        Order progress
      </p>

      {cancelled && (
        <div className="mb-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5">
          <p className="text-sm font-semibold text-rose-700">Order status: Cancelled / Rejected</p>
          {(() => {
            const who = order.cancelledBy?.name
              ? order.cancelledBy
              : cancelEntry
                ? {
                    name: cancelEntry.byName,
                    email: cancelEntry.byEmail,
                    mobile: cancelEntry.byMobile,
                    role: cancelEntry.byRole,
                    at: cancelEntry.at,
                    note: cancelEntry.note,
                  }
                : null;
            if (!who) return null;
            const roleLabel =
              who.role === 'admin'
                ? 'Admin'
                : who.role === 'corporate' || who.role === 'dealer'
                  ? 'Corporate customer'
                  : 'Customer';
            return (
              <div className="mt-1.5 space-y-0.5 text-[11px] text-rose-600/90">
                <p>
                  <span className="font-semibold text-rose-700">Cancelled by:</span> {roleLabel}
                </p>
                {who.name ? (
                  <p>
                    <span className="font-semibold text-rose-700">Name:</span> {who.name}
                  </p>
                ) : null}
                {who.email ? (
                  <p>
                    <span className="font-semibold text-rose-700">Email:</span> {who.email}
                  </p>
                ) : null}
                {who.mobile ? (
                  <p>
                    <span className="font-semibold text-rose-700">Phone:</span> {who.mobile}
                  </p>
                ) : null}
                {who.at ? (
                  <p>
                    <span className="font-semibold text-rose-700">On:</span> {formatWhen(who.at)}
                  </p>
                ) : null}
              </div>
            );
          })()}
        </div>
      )}

      <ol>
        {ORDER_FLOW.map((step, idx) => {
          if (cancelled && currentIdx >= 0 && idx > currentIdx) return null;

          const passed = currentIdx > idx;
          const active = !cancelled && currentIdx === idx && current !== 'delivered';
          const deliveredDone = current === 'delivered' && idx <= currentIdx;
          const reached = cancelled ? idx <= currentIdx : currentIdx >= idx;
          const entry = historyFor(step, history);
          const isLastVisible =
            cancelled && currentIdx >= 0
              ? idx === currentIdx
              : idx === ORDER_FLOW.length - 1;
          const complete = cancelled
            ? idx <= currentIdx
            : passed || deliveredDone;

          return (
            <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
              {!isLastVisible && !cancelled && (
                <span
                  className={`absolute left-[9px] top-5 h-[calc(100%-12px)] w-0.5 ${
                    passed || (current === 'delivered' && idx < currentIdx)
                      ? 'bg-[#1a4b8c]'
                      : 'bg-gray-200'
                  }`}
                  aria-hidden
                />
              )}
              {cancelled && idx < currentIdx && (
                <span
                  className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-0.5 bg-[#1a4b8c]"
                  aria-hidden
                />
              )}
              <span
                className={`relative z-[1] mt-0.5 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  complete
                    ? 'bg-[#1a4b8c] text-white shadow-sm shadow-[#1a4b8c]/30'
                    : active
                      ? 'bg-[#78c6d4] text-white ring-4 ring-[#78c6d4]/25'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {complete ? '✓' : idx + 1}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={`text-[13px] font-semibold ${
                    reached ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {formatOrderStatus(step, { forCustomer })}
                  {active ? (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-[#1a4b8c]">
                      Current
                    </span>
                  ) : null}
                </p>
                {entry ? (
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-400">
                    {formatWhen(entry.at)}
                    {entry.byRole === 'admin' && entry.byName
                      ? ` · by ${entry.byName}`
                      : entry.note
                        ? ` · ${entry.note}`
                        : ''}
                  </p>
                ) : reached && !cancelled ? (
                  <p className="mt-0.5 text-[11px] text-gray-300">Waiting…</p>
                ) : null}
              </div>
            </li>
          );
        })}

        {cancelled && (
          <li className="relative flex gap-3">
            <span className="relative z-[1] mt-0.5 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
              ✕
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] font-semibold text-rose-700">Cancelled</p>
              {cancelEntry?.at ? (
                <p className="mt-0.5 text-[11px] text-rose-400">{formatWhen(cancelEntry.at)}</p>
              ) : null}
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}
