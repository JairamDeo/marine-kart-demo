import { ShieldBan, X } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

/**
 * Shown when an inactive / blocked account attempts to sign in.
 */
export default function AccountBlockedModal({ open, email, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-blocked-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-xl ring-1 ring-gray-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <BrandLogo className="mx-auto mb-4 h-10 w-auto" />

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldBan size={28} />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Access restricted
        </p>
        <h2 id="account-blocked-title" className="mt-1 text-xl font-bold text-navy">
          Account blocked
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Your account
          {email ? (
            <>
              {' '}
              (<span className="font-medium text-gray-800">{email}</span>)
            </>
          ) : null}{' '}
          has been blocked by the administrator.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Please contact admin for assistance to restore access to your MarineKart account.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#1a4b8c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#143a6e]"
          >
            Understood
          </button>
          <a
            href="/contact-us"
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-gray-50"
          >
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
