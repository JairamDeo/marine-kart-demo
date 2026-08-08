import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function OrderSuccessModal({ orderId, onClose }) {
  return (
    <div className="portal-overlay fixed inset-0 z-[100] flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm">
      <div className="portal-modal-in w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 inline-flex rounded-xl bg-black px-2 py-1.5">
          <BrandLogo className="h-10 w-auto" />
        </div>
        <div className="success-check mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <span className="success-check-ring" />
          <Check className="relative z-10 text-emerald-500" size={36} strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold text-navy">Order Placed!</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Thank you for shopping with MarineKart. Your order has been received and is being
          processed.
        </p>
        {orderId && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Order ID: <span className="font-mono font-semibold text-navy">{orderId}</span>
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to={orderId ? `/account/orders?order=${orderId}` : '/account/orders'}
            className="btn-cyan rounded-xl px-5 py-2.5 text-sm"
            onClick={onClose}
          >
            View Order
          </Link>
          <Link
            to="/shop"
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-gray-50"
            onClick={onClose}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
