import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  Mail,
  Phone,
  Shield,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { friendlyError } from '../../utils/toastMsg';

export default function CorporateAccount() {
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

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'D';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Account</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your corporate profile</p>
      </div>

      <div className="portal-fade-in overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a4b8c] via-[#16407a] to-[#0f172a] text-white shadow-lg">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold ring-2 ring-white/20 backdrop-blur">
              {initials}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan">
                Corporate account
              </p>
              <h2 className="mt-0.5 text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                <Mail size={14} />
                {user?.email}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              active ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-100'
            }`}
          >
            <CheckCircle2 size={14} />
            {active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="portal-fade-in rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/15 text-navy">
            <Shield size={20} />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Account type</p>
          <p className="mt-1 text-2xl font-bold text-navy">Corporate</p>
        </div>
        <div className="portal-fade-in rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <UserRound size={20} />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</p>
          <p className="mt-1 text-2xl font-bold text-navy">{active ? 'Active' : 'Inactive'}</p>
          <p className="mt-1 text-xs text-gray-500">Contact support if locked</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <form
          onSubmit={onSave}
          className="portal-fade-in space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-3"
        >
          <div className="mb-1 flex items-center gap-2">
            <UserRound className="text-navy" size={18} />
            <h3 className="text-base font-bold text-navy">Profile details</h3>
          </div>
          <p className="text-sm text-gray-500">Update your name and phone. Email cannot be changed here.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">First name</label>
              <input
                required
                className="input-mk rounded-xl"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Last name</label>
              <input
                required
                className="input-mk rounded-xl"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                <Mail size={16} className="text-gray-400" />
                {user?.email}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input-mk rounded-xl pl-10"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-[#1a4b8c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143a6e] disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Save changes'}
          </button>
        </form>

        <div className="portal-fade-in rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy">Quick links</h3>
          <div className="space-y-2">
            <Link
              to="/account/orders"
              className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 text-sm font-medium text-gray-800 transition hover:border-navy/20 hover:bg-blue-50/50"
            >
              <ShoppingBag className="text-navy" size={18} />
              My orders
            </Link>
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 text-sm font-medium text-gray-800 transition hover:border-cyan/30 hover:bg-cyan/5"
            >
              <Shield className="text-cyan-dark" size={18} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
