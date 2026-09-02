import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, PlusCircle, X } from 'lucide-react';
import {
  addressFromSaved,
  emptyAddress,
  formatAddressLine,
  lookupCityStateFromPin,
} from '../../utils/address';

/**
 * Checkout-style delivery address — saved profile addresses + new address form.
 */
export default function DeliveryAddressSection({ user, value, onChange, compact = false }) {
  const savedAddresses = useMemo(() => user?.addresses || [], [user]);

  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const pinTimer = useRef(null);
  const seededFor = useRef('');
  const userKey = user?.id || user?._id || '';

  useEffect(() => {
    if (!user || seededFor.current === userKey) return;
    seededFor.current = userKey;
    if (savedAddresses.length) {
      const pick =
        savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(String(pick._id));
      onChange(addressFromSaved(pick, user));
      setShowNewForm(false);
      return;
    }
    setSelectedAddressId('new');
    setShowNewForm(true);
    onChange({
      ...emptyAddress,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      phone: user.phone || '',
      country: 'India',
    });
  }, [user, userKey, savedAddresses, onChange]);

  useEffect(
    () => () => {
      if (pinTimer.current) clearTimeout(pinTimer.current);
    },
    []
  );

  const setAddr = (key, val) => {
    onChange({ ...value, [key]: val });
  };

  const selectSaved = (addr) => {
    setSelectedAddressId(String(addr._id));
    onChange(addressFromSaved(addr, user));
    setShowNewForm(false);
  };

  const startNewAddress = () => {
    setSelectedAddressId('new');
    onChange({
      ...emptyAddress,
      fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      phone: user?.phone || '',
      country: 'India',
    });
    setShowNewForm(true);
  };

  const cancelNewAddress = () => {
    setShowNewForm(false);
    const prev = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    if (prev) {
      setSelectedAddressId(String(prev._id));
      onChange(addressFromSaved(prev, user));
    }
  };

  const onPostalCodeChange = (raw) => {
    const postalCode = String(raw || '').replace(/\D/g, '').slice(0, 6);
    onChange({ ...value, postalCode });

    if (pinTimer.current) clearTimeout(pinTimer.current);
    if (postalCode.length < 6) return;

    pinTimer.current = setTimeout(async () => {
      setPinBusy(true);
      try {
        const hit = await lookupCityStateFromPin(postalCode, 'India');
        if (!hit) return;
        onChange({
          ...value,
          postalCode,
          city: hit.city || value.city,
          state: hit.state || value.state,
          country: hit.country || value.country || 'India',
        });
      } finally {
        setPinBusy(false);
      }
    }, 400);
  };

  const shellClass = compact
    ? 'rounded-xl border border-gray-200/80 bg-[#fafbfd] p-3.5'
    : 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100';

  return (
    <div className={shellClass}>
      <div className={`mb-3 flex items-center gap-2 ${compact ? 'mb-2.5' : ''}`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f4f8] text-[#1a4b8c]">
          <MapPin size={16} />
        </span>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Delivery address</h3>
          <p className="text-[11px] text-gray-400">
            {savedAddresses.length
              ? 'Choose saved or add a new one'
              : 'Add your delivery address'}
          </p>
        </div>
      </div>

      {savedAddresses.length > 0 && (
        <div className="mb-3 space-y-2">
          {savedAddresses.map((addr) => {
            const id = String(addr._id);
            const selected = selectedAddressId === id && !showNewForm;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectSaved(addr)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  selected
                    ? 'border-[#1a4b8c] bg-[#f3f8fb] ring-1 ring-[#1a4b8c]/30'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">
                      {addr.label || 'Address'}
                      {addr.isDefault ? (
                        <span className="ml-1.5 text-[10px] font-medium text-[#1a4b8c]">
                          Default
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                      {formatAddressLine(addr)}
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${
                      selected ? 'border-[#1a4b8c] bg-[#1a4b8c]' : 'border-gray-300'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {savedAddresses.length > 0 && (
        <button
          type="button"
          onClick={startNewAddress}
          className={`mb-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5 text-xs font-semibold transition ${
            showNewForm
              ? 'border-[#1a4b8c] bg-[#eef6fa] text-[#1a4b8c]'
              : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <PlusCircle size={14} />
          Add new address
        </button>
      )}

      {(showNewForm || savedAddresses.length === 0) && (
        <div className="relative mb-1 origin-top rotate-[0.6deg] rounded-2xl border border-[#78c6d4]/50 bg-gradient-to-br from-[#f0f9fb] to-white p-3.5 shadow-[0_8px_24px_rgba(26,75,140,0.12)] ring-1 ring-[#1a4b8c]/10">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-[#1a4b8c]">New delivery address</p>
            {savedAddresses.length > 0 ? (
              <button
                type="button"
                onClick={cancelNewAddress}
                className="rounded-lg p-1 text-gray-400 transition hover:bg-white hover:text-gray-700"
                aria-label="Cancel new address"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                Full name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                className="input-mk rounded-xl border-cyan/30 bg-white py-2 text-sm"
                value={value.fullName}
                onChange={(e) => setAddr('fullName', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                Phone <span className="text-rose-500">*</span>
              </label>
              <input
                required
                className="input-mk rounded-xl border-cyan/30 bg-white py-2 text-sm"
                value={value.phone}
                onChange={(e) => setAddr('phone', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                Address <span className="text-rose-500">*</span>
              </label>
              <input
                required
                placeholder="Street, building, area"
                className="input-mk rounded-xl border-cyan/30 bg-white py-2 text-sm"
                value={value.line1}
                onChange={(e) => setAddr('line1', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <input
                placeholder="Landmark / line 2 (optional)"
                className="input-mk rounded-xl border-cyan/30 bg-white py-2 text-sm"
                value={value.line2}
                onChange={(e) => setAddr('line2', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                PIN code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit PIN — city & state auto-fill"
                  className="input-mk rounded-xl border-cyan/30 bg-white py-2 pr-10 text-sm"
                  value={value.postalCode}
                  onChange={(e) => onPostalCodeChange(e.target.value)}
                />
                {pinBusy ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-cyan">
                    …
                  </span>
                ) : null}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                required
                className="input-mk rounded-xl border-cyan/30 bg-white py-2 text-sm"
                value={value.city}
                onChange={(e) => setAddr('city', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                required
                className="input-mk rounded-xl border-cyan/30 bg-white py-2 text-sm"
                value={value.state}
                onChange={(e) => setAddr('state', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                Country <span className="text-rose-500">*</span>
              </label>
              <input
                required
                className="input-mk rounded-xl border-cyan/30 bg-white py-2 text-sm"
                value={value.country}
                onChange={(e) => setAddr('country', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {!showNewForm && savedAddresses.length > 0 && (
        <p className="mt-1 text-[11px] text-gray-400">
          Using saved address. Tap “Add new address” to enter another.
        </p>
      )}
    </div>
  );
}
