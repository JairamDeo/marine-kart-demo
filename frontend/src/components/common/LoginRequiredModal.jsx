import { Link } from 'react-router-dom';
import { Lock, X } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function LoginRequiredModal({
  open,
  message = 'Please login first to continue.',
  redirectTo = '/login',
  from = '/cart',
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="portal-overlay fixed inset-0 z-[120] flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        className="portal-modal-in relative w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="mx-auto mb-4 inline-flex rounded-xl bg-black px-2 py-1.5">
          <BrandLogo className="h-10 w-auto" />
        </div>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan/15 text-navy">
          <Lock size={24} />
        </div>

        <h2 id="login-required-title" className="text-xl font-bold text-navy">
          Please login first
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{message}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to={redirectTo}
            state={{ from }}
            onClick={onClose}
            className="btn-cyan rounded-xl px-6 py-3 text-sm"
          >
            Login
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-gray-50"
          >
            Continue browsing
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          New here?{' '}
          <Link to="/register" onClick={onClose} className="font-semibold text-navy hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
