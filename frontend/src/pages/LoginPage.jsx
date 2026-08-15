import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Anchor, Building2, Loader2, Lock, ShoppingBag, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCartUI } from '../context/CartUIContext';
import BrandLogo from '../components/common/BrandLogo';
import PasswordInput from '../components/portal/PasswordInput';
import OtpVerifyModal from '../components/auth/OtpVerifyModal';
import ApprovalPendingModal from '../components/auth/ApprovalPendingModal';
import AccountBlockedModal from '../components/auth/AccountBlockedModal';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import { authService } from '../services/auth.service';
import { friendlyError } from '../utils/toastMsg';

export default function LoginPage() {
  const { login, isAuthenticated, user, completeEmailVerification } = useAuth();
  const { openCheckout } = useCartUI();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accountType, setAccountType] = useState(
    searchParams.get('type') === 'corporate' ? 'corporate' : 'customer'
  );
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [blockedEmail, setBlockedEmail] = useState('');

  const afterLogin = (role) => {
    const wantCheckout = sessionStorage.getItem('mk_open_checkout') === '1';
    if (wantCheckout) {
      sessionStorage.removeItem('mk_open_checkout');
      navigate('/', { replace: true });
      setTimeout(() => openCheckout(), 80);
      return;
    }
    const redirect = searchParams.get('redirect');
    if (redirect) {
      navigate(redirect, { replace: true });
      return;
    }
    navigate(role === 'corporate' ? '/' : '/', { replace: true });
  };

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'customer' || user?.role === 'corporate')) {
      afterLogin(user.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (searchParams.get('type') === 'corporate') setAccountType('corporate');
  }, [searchParams]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const toastId = toast.loading('Signing you in...');
    try {
      const loggedIn = await login(form.email, form.password, {
        expectedRole: accountType === 'corporate' ? 'corporate' : 'customer',
      });
      toast.success('Welcome back! Login successful.', { id: toastId });
      afterLogin(loggedIn.role);
    } catch (err) {
      if (err.code === 'WRONG_PORTAL') {
        const msg =
          err.actualRole === 'admin'
            ? 'Administrators should use Admin Sign In.'
            : accountType === 'corporate'
              ? 'This account is a normal customer. Switch to Normal Customer login.'
              : 'This account is corporate. Switch to Corporate Customer login.';
        toast.error(msg, { id: toastId });
      } else if (err.code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Account not verified. Enter the OTP sent to your email.', {
          id: toastId,
          duration: 5000,
        });
        const email = err.email || form.email;
        const type = err.accountType || accountType;
        setOtpEmail(email);
        setAccountType(type === 'corporate' ? 'corporate' : 'customer');
        setOtpOpen(true);
        authService.resendOtp({ email, accountType: type }).catch(() => {});
      } else if (err.code === 'PENDING_APPROVAL') {
        toast('Your application is awaiting admin approval.', {
          id: toastId,
          icon: '⏳',
          duration: 5000,
        });
        setOtpEmail(err.email || form.email);
        setAccountType(
          (err.accountType || accountType) === 'corporate' ? 'corporate' : 'customer'
        );
        setApprovalOpen(true);
      } else if (err.code === 'ACCOUNT_BLOCKED' || err.code === 'ACCOUNT_REJECTED') {
        toast.dismiss(toastId);
        setBlockedEmail(err.email || form.email);
        setBlockedOpen(true);
      } else {
        toast.error(friendlyError(err, 'Could not sign in. Check your email and password.'), {
          id: toastId,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const onVerified = async (nextUser, token) => {
    const loggedIn = await completeEmailVerification(nextUser, token);
    setOtpOpen(false);
    toast.success('Email verified. You are signed in.');
    afterLogin(loggedIn.role);
  };

  const onPendingApproval = (data) => {
    setOtpOpen(false);
    setOtpEmail(data?.email || otpEmail || form.email);
    if (data?.accountType) {
      setAccountType(data.accountType === 'corporate' ? 'corporate' : 'customer');
    }
    setApprovalOpen(true);
  };

  const isCorporate = accountType === 'corporate';

  const highlights = [
    { icon: ShoppingBag, text: 'Browse catalog & ask for price' },
    { icon: Lock, text: 'Secure account & order history' },
    {
      icon: isCorporate ? Building2 : Anchor,
      text: isCorporate ? 'Corporate console for orders' : 'Trusted marine hardware catalog',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-[#eef5f9]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(120,198,212,0.35), transparent 42%), radial-gradient(circle at 88% 12%, rgba(26,75,140,0.18), transparent 38%), linear-gradient(160deg, #e8f4f8 0%, #f7fbfd 48%, #eef4f8 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(26,75,140,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(26,75,140,0.35) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
        }}
      />

      <div className="container-mk relative flex items-center justify-center py-6 sm:py-8 lg:py-10">
        <div className="grid w-full max-w-[980px] overflow-hidden rounded-2xl border border-[#d5e4ef] bg-white lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left panel */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#1a4b8c] via-[#163f78] to-[#0f172a] p-8 text-white lg:flex lg:flex-col lg:justify-between lg:p-9">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 left-8 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
            <div className="pointer-events-none absolute bottom-28 right-8 h-24 w-24 rounded-full border border-white/15" />

            <div className="relative z-10">
              <BrandLogo className="mb-7 h-12 w-auto" />
              <h1 className="max-w-sm text-[1.85rem] font-extrabold leading-tight tracking-tight">
                {isCorporate
                  ? 'Corporate customer access'
                  : 'Your marine storefront, ready when you are'}
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
                {isCorporate
                  ? 'Sign in with your corporate account to send enquiries and manage orders.'
                  : 'Sign in to manage your cart & wishlist, and send product enquiries.'}
              </p>
            </div>

            <ul className="relative z-10 mt-8 space-y-2.5">
              {highlights.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan/20 text-cyan">
                    <Icon size={16} />
                  </span>
                  <span className="text-sm font-medium text-white/90">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form panel */}
          <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
            <div className="mb-4 lg:hidden">
              <h1 className="text-xl font-bold text-navy">Sign In</h1>
              <p className="mt-0.5 text-sm text-gray-500">Login to shop and send enquiries</p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-xl bg-[#f1f5f9] p-1">
              <button
                type="button"
                onClick={() => setAccountType('customer')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:text-sm ${
                  !isCorporate
                    ? 'bg-white text-navy ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserRound size={15} />
                Normal
              </button>
              <button
                type="button"
                onClick={() => setAccountType('corporate')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:text-sm ${
                  isCorporate
                    ? 'bg-white text-navy ring-1 ring-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 size={15} />
                Corporate
              </button>
            </div>

            <h2 className="text-lg font-bold text-navy sm:text-xl">
              {isCorporate ? 'Corporate Sign In' : 'Welcome back'}
            </h2>
            <p className="mt-0.5 mb-4 text-sm text-gray-500">
              {isCorporate
                ? 'Use your corporate credentials'
                : 'Sign in to continue shopping with MarineKart'}
            </p>

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="input-mk rounded-xl"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <PasswordInput
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="btn-cyan hero-cta inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm font-semibold text-navy hover:underline"
                >
                  Forgot password?
                </button>
              </p>
            </form>

            <p className="mt-2 text-center text-sm text-gray-500">
              New here?{' '}
              <Link to="/register" className="font-semibold text-navy hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <OtpVerifyModal
        open={otpOpen}
        email={otpEmail}
        accountType={accountType}
        onClose={() => setOtpOpen(false)}
        onVerified={onVerified}
        onPendingApproval={onPendingApproval}
      />
      <ApprovalPendingModal
        open={approvalOpen}
        email={otpEmail || form.email}
        accountType={accountType}
        onClose={() => setApprovalOpen(false)}
        onGoToLogin={() => setApprovalOpen(false)}
      />
      <AccountBlockedModal
        open={blockedOpen}
        email={blockedEmail || form.email}
        onClose={() => setBlockedOpen(false)}
      />
      <ForgotPasswordModal
        open={forgotOpen}
        accountType={accountType}
        initialEmail={form.email}
        onClose={() => setForgotOpen(false)}
        onSuccess={(email) => setForm((f) => ({ ...f, email, password: '' }))}
      />
    </div>
  );
}
