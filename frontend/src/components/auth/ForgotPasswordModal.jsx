import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, X } from 'lucide-react';
import PasswordInput from '../portal/PasswordInput';
import { authService } from '../../services/auth.service';
import { friendlyError } from '../../utils/toastMsg';

const DIGITS = 4;
const OTP_SECONDS = 120;

/**
 * Short 3-step forgot-password modal for customer / corporate / admin.
 * 1) email → 2) 4-digit OTP (2 min) → 3) new + confirm password
 */
export default function ForgotPasswordModal({
  open,
  accountType = 'customer',
  initialEmail = '',
  onClose,
  onSuccess,
}) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(() => Array(DIGITS).fill(''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setEmail(String(initialEmail || '').trim());
    setDigits(Array(DIGITS).fill(''));
    setPassword('');
    setConfirmPassword('');
    setCooldown(0);
    setExpiresIn(0);
    setBusy(false);
    setResendBusy(false);
  }, [open, initialEmail, accountType]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (expiresIn <= 0) return undefined;
    const id = setInterval(() => setExpiresIn((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [expiresIn]);

  if (!open) return null;

  const code = digits.join('');
  const accent =
    accountType === 'admin'
      ? 'bg-gray-900 hover:bg-gray-800'
      : accountType === 'corporate'
        ? 'bg-teal-700 hover:bg-teal-800'
        : 'bg-[#1a4b8c] hover:bg-[#143a6e]';
  const focusRing =
    accountType === 'admin'
      ? 'focus:border-gray-900 focus:ring-gray-900/15'
      : accountType === 'corporate'
        ? 'focus:border-teal-700 focus:ring-teal-700/15'
        : 'focus:border-[#1a4b8c] focus:ring-[#1a4b8c]/15';
  const typeLabel =
    accountType === 'admin'
      ? 'admin'
      : accountType === 'corporate'
        ? 'corporate customer'
        : 'normal customer';

  const startOtpTimers = () => {
    setExpiresIn(OTP_SECONDS);
    setCooldown(60);
  };

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
    inputsRef.current[Math.min(pasted.length, DIGITS - 1)]?.focus();
  };

  const sendOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error('Enter your email');
      return;
    }
    setBusy(true);
    const toastId = toast.loading('Checking email...');
    try {
      await authService.forgotPassword({ email: trimmed, accountType });
      setEmail(trimmed);
      setDigits(Array(DIGITS).fill(''));
      setStep(2);
      startOtpTimers();
      toast.success('OTP sent to your email', { id: toastId });
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } catch (err) {
      toast.error(friendlyError(err, 'No account found for this email'), { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (code.length !== DIGITS) {
      toast.error('Enter the 4-digit OTP');
      return;
    }
    if (expiresIn <= 0) {
      toast.error('OTP expired. Please resend.');
      return;
    }
    setBusy(true);
    const toastId = toast.loading('Verifying OTP...');
    try {
      await authService.verifyResetOtp({ email, code, accountType });
      setStep(3);
      toast.success('OTP verified', { id: toastId });
    } catch (err) {
      toast.error(friendlyError(err, 'Invalid or expired OTP'), { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const submitNewPassword = async () => {
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setBusy(true);
    const toastId = toast.loading('Updating password...');
    try {
      await authService.resetPassword({
        email,
        code,
        accountType,
        password,
        confirmPassword,
      });
      toast.success('Password updated. Sign in with your new password.', { id: toastId });
      onSuccess?.(email);
      onClose?.();
    } catch (err) {
      toast.error(friendlyError(err, 'Could not reset password'), { id: toastId });
      if (err?.data?.code === 'OTP_EXPIRED' || /expired/i.test(err?.message || '')) {
        setStep(2);
        setDigits(Array(DIGITS).fill(''));
        setExpiresIn(0);
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || resendBusy) return;
    setResendBusy(true);
    const toastId = toast.loading('Sending new code...');
    try {
      await authService.forgotPassword({ email, accountType });
      setDigits(Array(DIGITS).fill(''));
      startOtpTimers();
      toast.success('New OTP sent', { id: toastId });
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(friendlyError(err, 'Could not resend OTP'), { id: toastId });
    } finally {
      setResendBusy(false);
    }
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (step === 1) sendOtp();
    else if (step === 2) verifyOtp();
    else submitNewPassword();
  };

  const expiryLabel =
    expiresIn > 0
      ? `${String(Math.floor(expiresIn / 60)).padStart(1, '0')}:${String(expiresIn % 60).padStart(2, '0')}`
      : '0:00';

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
        aria-labelledby="forgot-title"
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
        <h2 id="forgot-title" className="mt-1 text-lg font-bold text-gray-900">
          Forgot password
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Reset your {typeLabel} account password.
        </p>

        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full ${
                n <= step ? 'bg-[#1a4b8c]' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
          Step {step} of 3
        </p>

        <form onSubmit={onFormSubmit} className="mt-4 space-y-4">
          {step === 1 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="input-mk rounded-xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm leading-relaxed text-gray-500">
                Enter the 4-digit code sent to{' '}
                <span className="font-medium text-gray-800">{email}</span>.
              </p>
              <p
                className={`mt-1 text-xs ${expiresIn > 0 ? 'text-gray-400' : 'font-medium text-red-500'}`}
              >
                {expiresIn > 0 ? `OTP expires in ${expiryLabel}` : 'OTP expired — resend a new code'}
              </p>
              <div className="mt-4 flex justify-center gap-2" onPaste={onPaste}>
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
                    className={`h-12 w-12 rounded-lg border border-gray-200 bg-white text-center text-lg font-semibold text-gray-900 outline-none transition focus:ring-2 ${focusRing}`}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-500">
                <span>Didn&apos;t get the code?</span>
                <button
                  type="button"
                  disabled={resendBusy || cooldown > 0}
                  onClick={resend}
                  className="inline-flex items-center gap-1 font-semibold text-[#1a4b8c] hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                >
                  {resendBusy ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    `Resend in ${cooldown}s`
                  ) : (
                    'Resend OTP'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  New password
                </label>
                <PasswordInput
                  id="forgot-new-password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <PasswordInput
                  id="forgot-confirm-password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={
              busy ||
              (step === 2 && (code.length !== DIGITS || expiresIn <= 0))
            }
            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 ${accent}`}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {step === 1 ? 'Sending...' : step === 2 ? 'Verifying...' : 'Updating...'}
              </>
            ) : step === 1 ? (
              'Send OTP'
            ) : step === 2 ? (
              'Verify OTP'
            ) : (
              'Update password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
