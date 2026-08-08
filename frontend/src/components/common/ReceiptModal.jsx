import { useEffect } from 'react';
import OrderReceipt from './OrderReceipt';
import OrderItemsTable from './OrderItemsTable';

/**
 * Order receipt modal — same layout as admin:
 * receipt (no inline item list) + paginated items table.
 */
export default function ReceiptModal({ open, onClose, order, footer }) {
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
        aria-label="Order receipt"
      >
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 sm:p-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <OrderReceipt
              order={order}
              onClose={onClose}
              showItems={false}
              showCustomer
              compact
            />
          </div>
          <div className="space-y-3 lg:col-span-7">
            <OrderItemsTable items={order.items || []} />
            {footer ? <div>{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
