import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { friendlyError } from '../../utils/toastMsg';

const DIGITS = 6;

/**
 * Minimal 6-box email OTP verification modal.
 * onVerified(user, token) — parent persists session when fully approved.
 * onPendingApproval(data) — email verified but awaiting admin approval (no login).
 */
export default function OtpVerifyModal({
  open,
  email,
  accountType = 'customer',
  onClose,
  onVerified,
  onPendingApproval,
}) {
  const [digits, setDigits] = useState(() => Array(DIGITS).fill(''));
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!open) return;
    setDigits(Array(DIGITS).fill(''));
    setCooldown(0);
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, email]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  if (!open) return null;

  const code = digits.join('');

  const setDigitAt = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    if (char && index < DIGITS - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const onPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS);
    if (!pasted) return;
    const next = Array(DIGITS).fill('');
    pasted.split('').forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    const focusAt = Math.min(pasted.length, DIGITS - 1);
    inputsRef.current[focusAt]?.focus();
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (code.length !== DIGITS) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setBusy(true);
    const toastId = toast.loading('Verifying...');
    try {
      const { data } = await authService.verifyEmail({ email, code, accountType });
      if (data.data?.needsApproval) {
        toast.success('Email verified', { id: toastId });
        onPendingApproval?.(data.data);
        return;
      }
      toast.success('Email verified successfully', { id: toastId });
      onVerified?.(data.data.user, data.data.token);
    } catch (err) {
      toast.error(friendlyError(err, 'Invalid or expired code'), { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || resendBusy) return;
    setResendBusy(true);
    const toastId = toast.loading('Sending new code...');
    try {
      await authService.resendOtp({ email, accountType });
      toast.success('New code sent to your email', { id: toastId });
      setDigits(Array(DIGITS).fill(''));
      setCooldown(60);
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(friendlyError(err, 'Could not resend code'), { id: toastId });
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-title"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
          MarineKart
        </p>
        <h2 id="otp-title" className="mt-1 text-lg font-bold text-gray-900">
          Thank you for registering
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          We have sent a verification code to verify your account. Please enter the code sent to{' '}
          <span className="font-medium text-gray-800">{email}</span>.
        </p>
        <p className="mt-1 text-xs text-gray-400">OTP expires in 10 minutes.</p>

        <form onSubmit={submit} className="mt-5">
          <div className="flex justify-between gap-2" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={d}
                onChange={(e) => setDigitAt(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                className="h-11 w-10 rounded-lg border border-gray-200 bg-white text-center text-base font-semibold text-gray-900 outline-none transition focus:border-[#1a4b8c] focus:ring-2 focus:ring-[#1a4b8c]/15 sm:h-12 sm:w-11"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={busy || code.length !== DIGITS}
            className="mt-5 h-11 w-full rounded-xl bg-[#1a4b8c] text-sm font-semibold text-white transition hover:bg-[#143a6e] disabled:opacity-50"
          >
            {busy ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-500">
          <span>Didn&apos;t get the code?</span>
          <button
            type="button"
            disabled={resendBusy || cooldown > 0}
            onClick={resend}
            className="font-semibold text-[#1a4b8c] hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resendBusy ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}
