import { X, UserRound } from 'lucide-react';
import OrderTracker from './OrderTracker';
import { formatOrderStatus } from '../../utils/orderStatusShared';
import { formatProductTitle } from '../../utils/productTitle';

const STATUS_TONE = {
  enquiry_received: 'bg-amber-50 text-amber-700 ring-amber-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  quotation_sent: 'bg-orange-50 text-orange-700 ring-orange-200',
  confirmed: 'bg-sky-50 text-sky-700 ring-sky-200',
  order_received: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  shipped: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  processing: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

export function OrderStatusPill({ status, forCustomer = false }) {
  if (!status) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
        STATUS_TONE[status] || 'bg-gray-50 text-gray-600 ring-gray-200'
      }`}
    >
      {formatOrderStatus(status, { forCustomer })}
    </span>
  );
}

/**
 * Compact order receipt.
 * showItems: hide line items when admin shows them in a paginated table instead.
 */
export default function OrderReceipt({
  order,
  onClose,
  compact = false,
  showItems = true,
  showCustomer = true,
  forCustomer = false,
}) {
  if (!order) return null;

  const addr = order.shippingAddress || order.billingAddress || {};
  const items = order.items || [];
  const user = order.user || null;
  const customerName =
    user?.firstName || user?.lastName
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : addr.fullName || '—';
  const phone = user?.phone || addr.phone || '';
  const addressLine = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(', ');
  const shipToName =
    addr.fullName && addr.fullName.trim().toLowerCase() !== customerName.trim().toLowerCase()
      ? addr.fullName
      : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] ${
        compact ? 'max-w-full' : 'w-full'
      }`}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a4b8c] via-[#1e5a9e] to-[#78c6d4] px-4 pb-4 pt-4 text-white">
        <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/15 p-1.5 text-white transition hover:bg-white/25"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <p className="pr-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
          Order receipt
        </p>
        <p className="mt-1 font-mono text-[15px] font-bold tracking-wide sm:text-base">
          {order.orderNumber}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <OrderStatusPill status={order.orderStatus} forCustomer={forCustomer} />
        </div>
        {order.createdAt && (
          <p className="mt-2 text-[11px] text-white/75">
            {new Date(order.createdAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      <div className="space-y-3 px-4 py-3.5">
        {showCustomer && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <UserRound size={12} />
              Ordered by
            </p>
            <div className="rounded-lg border border-gray-100 bg-white px-3 py-2.5 text-[13px]">
              <p className="font-semibold text-gray-900">{customerName}</p>
              {user?.email && <p className="mt-0.5 text-[11px] text-gray-500">{user.email}</p>}
              {phone && <p className="text-[11px] text-gray-400">{phone}</p>}
              {user?.role && (
                <p className="mt-1.5 inline-flex rounded-full bg-[#eef6f9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                  {user.role === 'dealer' ? 'corporate' : user.role}
                  {user.companyName ? ` · ${user.companyName}` : ''}
                </p>
              )}
              {!user && (
                <p className="mt-1 text-[11px] text-gray-400">Guest / account not linked</p>
              )}
              {(shipToName || addressLine) && (
                <div className="mt-2.5 border-t border-gray-100 pt-2.5">
                  {shipToName && (
                    <p className="text-[12px] font-medium text-gray-800">Ship to: {shipToName}</p>
                  )}
                  {addressLine && (
                    <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">{addressLine}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showItems && (
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Items
            </p>
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100 bg-gray-50/40">
              {items.map((item, idx) => (
                <li
                  key={item.product?._id || item.product || idx}
                  className="flex items-start justify-between gap-2 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug text-gray-900">
                      {formatProductTitle(item)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-gray-400">Qty {item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {order.quotation?.status === 'sent' && (
          <div className="rounded-lg bg-[#f4f7fb] px-3 py-2.5 text-[13px]">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Quotation
            </p>
            <div className="flex justify-between text-gray-600">
              <span>Items subtotal</span>
              <span className="font-medium text-gray-900">
                ₹
                {(
                  Number(order.quotation.itemsSubtotal || 0) +
                  Number(order.quotation.discountTotal || 0)
                ).toLocaleString('en-IN')}
              </span>
            </div>
            {Number(order.quotation.discountTotal) > 0 && (
              <div className="mt-1 flex justify-between text-gray-600">
                <span>Discount</span>
                <span className="font-medium text-gray-900">
                  ₹{Number(order.quotation.discountTotal || 0).toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div className="mt-1 flex justify-between text-gray-600">
              <span>Courier</span>
              <span className="font-medium text-gray-900">
                ₹{Number(order.quotation.courierCharges || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-gray-600">
              <span>GST ({order.quotation.gstPercent || 0}%)</span>
              <span className="font-medium text-gray-900">
                ₹{Number(order.quotation.gstAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-white/70 pt-2">
              <span className="font-bold text-gray-900">Grand total</span>
              <span className="text-base font-bold text-[#1a4b8c]">
                ₹{Number(order.quotation.grandTotal || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        <OrderTracker order={order} forCustomer={forCustomer} />
      </div>
    </div>
  );
}
