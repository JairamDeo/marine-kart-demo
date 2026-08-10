import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Anchor, Building2, Loader2, Lock, ShoppingBag, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCartUI } from '../context/CartUIContext';
import PasswordInput from '../components/portal/PasswordInput';
import BrandLogo from '../components/common/BrandLogo';
import OtpVerifyModal from '../components/auth/OtpVerifyModal';
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

  const isCorporate = accountType === 'corporate';

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-gradient-to-br from-[#e8f4f8] via-white to-[#f0f7fb]">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-navy/10 blur-3xl" />

      <div className="container-mk relative grid items-center gap-6 py-8 sm:gap-10 sm:py-12 lg:grid-cols-2 lg:py-16">
        <div className="hidden lg:block" data-aos="fade-right">
          <BrandLogo className="mb-6 h-36 w-auto sm:h-40" />
          <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-navy xl:text-4xl">
            {isCorporate ? 'Corporate customer access' : 'Your marine storefront, ready when you are'}
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-gray-600">
            {isCorporate
              ? 'Sign in with your corporate account to view prices and manage orders.'
              : 'Sign in to unlock prices, manage your cart & wishlist, and checkout in minutes.'}
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: ShoppingBag, text: 'View live product pricing' },
              { icon: Lock, text: 'Secure account & order history' },
              {
                icon: isCorporate ? Building2 : Anchor,
                text: isCorporate ? 'Corporate console for orders' : 'Trusted marine hardware catalog',
              },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy shadow-sm ring-1 ring-cyan/20">
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md" data-aos="fade-left">
          <div className="mb-6 lg:hidden">
            <BrandLogo className="mb-4 h-28 w-auto" />
            <h1 className="text-2xl font-bold text-navy">Sign In</h1>
            <p className="mt-1 text-sm text-gray-500">Login to view prices and shop</p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_20px_50px_rgba(26,75,140,0.12)] backdrop-blur sm:p-8">
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setAccountType('customer')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold transition sm:text-sm ${
                  !isCorporate ? 'bg-white text-navy shadow' : 'text-gray-500'
                }`}
              >
                <UserRound size={16} />
                Normal
              </button>
              <button
                type="button"
                onClick={() => setAccountType('corporate')}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold transition sm:text-sm ${
                  isCorporate ? 'bg-white text-navy shadow' : 'text-gray-500'
                }`}
              >
                <Building2 size={16} />
                Corporate
              </button>
            </div>

            <h2 className="mb-1 text-xl font-bold text-navy">
              {isCorporate ? 'Corporate Sign In' : 'Welcome back'}
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              {isCorporate
                ? 'Use your corporate credentials'
                : 'Sign in to continue shopping with MarineKart'}
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
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
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
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
                className="btn-cyan hero-cta inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition disabled:opacity-60"
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

            <p className="mt-6 text-center text-sm text-gray-500">
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
