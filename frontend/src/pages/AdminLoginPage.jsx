import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/portal/PasswordInput';
import AuthSplitLayout from '../components/portal/AuthSplitLayout';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import { friendlyError } from '../utils/toastMsg';

export default function AdminLoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const toastId = toast.loading('Signing you in...');
    try {
      await login(form.email, form.password, { expectedRole: 'admin' });
      toast.success('Login successful', { id: toastId });
      navigate('/admin');
    } catch (err) {
      if (err.code === 'WRONG_PORTAL') {
        toast.error('This login is for administrators only. Use Customer login instead.', {
          id: toastId,
        });
      } else {
        toast.error(friendlyError(err, 'Could not sign in. Check your email and password.'), {
          id: toastId,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Admin Sign In"
      subtitle="Manage products, orders, customers, and store analytics from one place."
      footerLinks={[
        { to: '/login', label: 'Customer login' },
        { to: '/login?type=corporate', label: 'Corporate login' },
      ]}
    >
      <h2 className="mb-1 hidden text-lg font-bold text-gray-900 lg:block">Welcome back</h2>
      <p className="mb-6 hidden text-sm text-gray-500 lg:block">Enter your administrator credentials</p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@example.com"
            className="input-mk rounded-xl"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs font-semibold text-gray-800 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput
            id="admin-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full cursor-pointer rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Please wait...' : 'Sign In'}
        </button>
      </form>

      <ForgotPasswordModal
        open={forgotOpen}
        accountType="admin"
        initialEmail={form.email}
        onClose={() => setForgotOpen(false)}
        onSuccess={(email) => setForm((f) => ({ ...f, email, password: '' }))}
      />
    </AuthSplitLayout>
  );
}
