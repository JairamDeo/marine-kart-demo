import { CheckCircle2, X } from 'lucide-react';
import BrandLogo from '../common/BrandLogo';

/**
 * Shown after successful email OTP — account awaits admin approval (no login yet).
 */
export default function ApprovalPendingModal({
  open,
  email,
  accountType = 'customer',
  onClose,
  onGoToLogin,
}) {
  if (!open) return null;

  const typeLabel = accountType === 'corporate' ? 'corporate' : 'customer';

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
        aria-labelledby="approval-pending-title"
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

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan/15 text-navy">
          <CheckCircle2 size={28} />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          Email verified
        </p>
        <h2 id="approval-pending-title" className="mt-1 text-xl font-bold text-navy">
          Application submitted for approval
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Thank you for verifying your email
          {email ? (
            <>
              {' '}
              (<span className="font-medium text-gray-800">{email}</span>)
            </>
          ) : null}
          . Your {typeLabel} account application has been sent to our admin team for review.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Please wait while we process your request. Once your account is approved, you will be
          notified by email and can sign in.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onGoToLogin || onClose}
            className="rounded-xl bg-[#1a4b8c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#143a6e]"
          >
            Back to sign in
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-gray-50"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
