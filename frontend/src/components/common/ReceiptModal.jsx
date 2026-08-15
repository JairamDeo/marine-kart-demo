import { useEffect } from 'react';
import OrderReceipt from './OrderReceipt';
import OrderItemsTable from './OrderItemsTable';
import { formatProductTitle } from '../../utils/productTitle';
import { productImageUrl } from '../../utils/productImage';
import { FileText } from 'lucide-react';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** Customer-facing quotation line items (read-only). */
function QuotationItemsPanel({ quotation }) {
  const items = quotation?.items || [];
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-[#f8fafc] to-white px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy">
          <FileText size={16} />
        </span>
        <div>
          <p className="text-sm font-bold text-gray-900">Quotation items</p>
          <p className="text-[11px] text-gray-400">
            {items.length} item{items.length === 1 ? '' : 's'} · prices from MarineKart
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-3 py-2.5 font-semibold">#</th>
              <th className="px-3 py-2.5 font-semibold">Product</th>
              <th className="px-3 py-2.5 font-semibold text-center">Qty</th>
              <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
              <th className="px-3 py-2.5 font-semibold text-right whitespace-nowrap">Disc. Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-400">
                  No quotation lines
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const qty = Number(item.quantity) || 0;
                const amount = Number(item.amount) || 0;
                const lineTotal =
                  item.lineTotal != null
                    ? Number(item.lineTotal)
                    : Math.round(amount * qty * 100) / 100;
                const thumb = productImageUrl({
                  images: item.image ? [item.image] : [],
                });
                return (
                  <tr key={item.product || item.sku || idx} className="hover:bg-[#f8fafc]">
                    <td className="px-3 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <img
                          src={thumb}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-md border border-gray-100 bg-gray-50 object-cover"
                        />
                        <p className="min-w-0 text-sm font-semibold leading-snug text-gray-900">
                          {formatProductTitle(item)}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-gray-800">{qty}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700">{money(amount)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-navy">{money(lineTotal)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {quotation?.grandTotal != null && (
        <div className="flex items-center justify-between border-t border-gray-100 bg-[#fafbfd] px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Grand total
          </span>
          <span className="text-base font-bold text-navy">{money(quotation.grandTotal)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Order receipt modal — same layout as admin:
 * receipt + items / quotation panel for customers.
 */
export default function ReceiptModal({ open, onClose, order, footer, forCustomer = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !order) return null;

  const quoteSent = order.quotation?.status === 'sent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div
        className="portal-overlay absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="portal-modal-in relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#f4f7fb] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={quoteSent ? 'View quotation' : 'Order receipt'}
      >
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 sm:p-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <OrderReceipt
              order={order}
              onClose={onClose}
              showItems={false}
              showCustomer
              compact
              forCustomer={forCustomer}
            />
          </div>
          <div className="space-y-3 lg:col-span-7">
            {quoteSent ? (
              <QuotationItemsPanel quotation={order.quotation} />
            ) : (
              <OrderItemsTable items={order.items || []} />
            )}
            {footer ? <div>{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
