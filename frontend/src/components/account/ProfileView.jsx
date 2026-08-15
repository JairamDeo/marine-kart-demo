import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Mail, Phone, ShoppingBag, Store } from 'lucide-react';
import ProfileAddresses from './ProfileAddresses';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { friendlyError } from '../../utils/toastMsg';

/**
 * Compact My Profile layout for customer + corporate accounts.
 */
export default function ProfileView({
  title = 'My Profile',
  accountLabel = 'Customer',
  shopHref = '/shop',
  shopLabel = 'Shop',
}) {
  const { user, applyUser } = useAuth();
  const active = user?.isActive !== false;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    });
  }, [user]);

  const onSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    const toastId = toast.loading('Saving profile...');
    try {
      const { data } = await authService.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      });
      applyUser(data.data.user);
      toast.success('Profile updated', { id: toastId });
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update profile'), { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  const initials =
    `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || accountLabel[0];

  return (
    <div className="portal-fade-in mx-auto max-w-4xl space-y-5">
      {/* Compact identity bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a4b8c] to-[#0f172a] text-sm font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-navy">{title}</h1>
              <span className="rounded-md bg-[#e8f4f8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                {accountLabel}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}
              >
                {active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-navy/25 hover:bg-[#f3f8fb]"
          >
            <ShoppingBag size={14} className="text-navy" />
            Orders
          </Link>
          <Link
            to={shopHref}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1a4b8c] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#143a6e]"
          >
            <Store size={14} />
            {shopLabel}
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Profile form — single tight panel */}
      <form
        onSubmit={onSave}
        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-navy">Account details</h2>
          <p className="text-[11px] text-gray-400">Email is locked</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">First name</label>
            <input
              required
              className="input-mk rounded-lg py-2 text-sm"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Last name</label>
            <input
              required
              className="input-mk rounded-lg py-2 text-sm"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <Mail size={14} className="shrink-0 text-gray-400" />
              <span className="truncate">{user?.email}</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-mk rounded-lg py-2 pl-9 text-sm"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="cursor-pointer rounded-lg bg-[#1a4b8c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#143a6e] disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      <ProfileAddresses />
    </div>
  );
}
