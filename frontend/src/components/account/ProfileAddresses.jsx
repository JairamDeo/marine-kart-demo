import { useState } from 'react';
import toast from 'react-hot-toast';
import { Home, MapPin, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { friendlyError } from '../../utils/toastMsg';

function formatLines(addr) {
  return [
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.postalCode,
    addr.country,
  ].filter(Boolean);
}

/**
 * Compact saved-address list for My Profile.
 */
export default function ProfileAddresses() {
  const { user, applyUser } = useAuth();
  const addresses = Array.isArray(user?.addresses) ? user.addresses : [];
  const [busyId, setBusyId] = useState('');

  const setDefault = async (id) => {
    setBusyId(String(id));
    const toastId = toast.loading('Updating default address...');
    try {
      const { data } = await authService.setDefaultAddress(id);
      if (data.data?.user) applyUser(data.data.user);
      toast.success('Default address updated', { id: toastId });
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update default address'), { id: toastId });
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-navy">Saved addresses</h2>
        {addresses.length > 0 && (
          <span className="text-[11px] font-medium text-gray-400">{addresses.length} saved</span>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-gray-200 bg-[#f8fbfd] px-3 py-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f4f8] text-navy">
            <MapPin size={16} />
          </span>
          <div>
            <p className="text-sm font-medium text-gray-800">No addresses yet</p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
              Addresses you add when sending an enquiry are saved here automatically.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100">
          {addresses.map((addr) => {
            const id = String(addr._id);
            const isDefault = Boolean(addr.isDefault);
            const lines = formatLines(addr);
            return (
              <li
                key={id}
                className={`flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  isDefault ? 'bg-[#f3f8fb]/80' : 'bg-white'
                }`}
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isDefault ? 'bg-[#1a4b8c] text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Home size={14} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900">{addr.label || 'Address'}</p>
                      {isDefault && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-[#1a4b8c]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#1a4b8c]">
                          <Star size={9} fill="currentColor" />
                          Default
                        </span>
                      )}
                    </div>
                    {(addr.fullName || addr.phone) && (
                      <p className="mt-0.5 text-xs text-gray-600">
                        {[addr.fullName, addr.phone].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{lines.join(', ')}</p>
                  </div>
                </div>

                {!isDefault && (
                  <button
                    type="button"
                    disabled={busyId === id}
                    onClick={() => setDefault(id)}
                    className="shrink-0 self-start rounded-md border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-navy transition hover:border-navy/30 hover:bg-white disabled:opacity-50 sm:self-center"
                  >
                    {busyId === id ? '...' : 'Set default'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
