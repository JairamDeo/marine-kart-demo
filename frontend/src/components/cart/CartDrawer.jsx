import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin,
  Minus,
  Plus,
  PlusCircle,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartUI } from '../../context/CartUIContext';
import { orderService } from '../../services/order.service';
import { authService } from '../../services/auth.service';
import { productImageUrl } from '../../utils/productImage';
import { formatProductTitle } from '../../utils/productTitle';
import { clampOrderQty } from '../../utils/maxOrderQty';
import { friendlyError } from '../../utils/toastMsg';
import { validateDeliveryAddress } from '../../utils/address';

const emptyAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

/** Resolve city + state from Indian PIN (primary) or Zippopotam (fallback). */
async function lookupCityStateFromPin(postalCode, country = 'India') {
  const code = String(postalCode || '').trim();
  if (!code) return null;

  const isIndia = String(country || 'India').toLowerCase().includes('india');
  if (isIndia && /^\d{6}$/.test(code)) {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        const po = data?.[0]?.PostOffice?.[0];
        if (data?.[0]?.Status === 'Success' && po) {
          return {
            city: po.District || po.Block || po.Name || '',
            state: po.State || '',
            country: 'India',
          };
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (code.length < 3) return null;
  try {
    const res = await fetch(`https://api.zippopotam.us/in/${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;
    return {
      city: place['place name'] || '',
      state: place.state || place['state abbreviation'] || '',
      country: data.country || country || 'India',
    };
  } catch {
    return null;
  }
}

function addressFromSaved(addr, user) {
  return {
    fullName: addr.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    phone: addr.phone || user?.phone || '',
    line1: addr.line1 || '',
    line2: addr.line2 || '',
    city: addr.city || '',
    state: addr.state || '',
    postalCode: addr.postalCode || '',
    country: addr.country || 'India',
  };
}

function addressesEqual(a, b) {
  const norm = (v) => String(v || '').trim().toLowerCase();
  return (
    norm(a.line1) === norm(b.line1) &&
    norm(a.line2) === norm(b.line2) &&
    norm(a.city) === norm(b.city) &&
    norm(a.state) === norm(b.state) &&
    norm(a.postalCode) === norm(b.postalCode)
  );
}

function formatAddressLine(addr) {
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode]
    .filter(Boolean)
    .join(', ');
}

export default function CartDrawer() {
  const {
    cart,
    user,
    isAuthenticated,
    updateCartQuantity,
    removeFromCart,
    requireLogin,
    refreshCart,
    applyUser,
  } = useAuth();
  const { cartOpen, closeCart, goToCartStep } = useCartUI();
  const navigate = useNavigate();

  const savedAddresses = useMemo(() => user?.addresses || [], [user]);
  const defaultSavedId = useMemo(() => {
    const def = savedAddresses.find((a) => a.isDefault);
    return String(def?._id || savedAddresses[0]?._id || '');
  }, [savedAddresses]);

  const [billing, setBilling] = useState(emptyAddress);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const pinTimer = useRef(null);

  const items = cart?.items || [];
  const itemCount = cart?.itemCount || 0;
  const lineCount = items.filter((i) => i?.product).length;

  useEffect(() => {
    if (!cartOpen || !user) return;
    if (savedAddresses.length) {
      const pick =
        savedAddresses.find((a) => String(a._id) === selectedAddressId) ||
        savedAddresses.find((a) => a.isDefault) ||
        savedAddresses[0];
      if (pick) {
        setSelectedAddressId(String(pick._id));
        setBilling(addressFromSaved(pick, user));
        return;
      }
    }
    setSelectedAddressId('new');
    setBilling((prev) => ({
      ...emptyAddress,
      fullName: prev.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      phone: prev.phone || user.phone || '',
      country: 'India',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartOpen, user?.id, defaultSavedId]);

  useEffect(() => {
    if (cartOpen) goToCartStep();
    else setShowNewForm(false);
  }, [cartOpen, goToCartStep]);

  const selectSaved = (addr) => {
    setSelectedAddressId(String(addr._id));
    setBilling(addressFromSaved(addr, user));
    setShowNewForm(false);
  };

  const startNewAddress = () => {
    setSelectedAddressId('new');
    setBilling({
      ...emptyAddress,
      fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      phone: user?.phone || '',
      country: 'India',
    });
    setShowNewForm(true);
  };

  const cancelNewAddress = () => {
    setShowNewForm(false);
    const prev =
      savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    if (prev) {
      setSelectedAddressId(String(prev._id));
      setBilling(addressFromSaved(prev, user));
    } else {
      setSelectedAddressId('new');
      setBilling({
        ...emptyAddress,
        fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        phone: user?.phone || '',
        country: 'India',
      });
    }
  };

  const setAddr = (key, value) => setBilling((prev) => ({ ...prev, [key]: value }));

  const onPostalCodeChange = (raw) => {
    const postalCode = String(raw || '').replace(/\D/g, '').slice(0, 6);
    setBilling((prev) => ({ ...prev, postalCode }));

    if (pinTimer.current) clearTimeout(pinTimer.current);
    if (postalCode.length < 6) return;

    pinTimer.current = setTimeout(async () => {
      setPinBusy(true);
      try {
        const hit = await lookupCityStateFromPin(postalCode, 'India');
        if (!hit) return;
        setBilling((prev) => ({
          ...prev,
          postalCode,
          city: hit.city || prev.city,
          state: hit.state || prev.state,
          country: hit.country || prev.country || 'India',
        }));
      } finally {
        setPinBusy(false);
      }
    }, 400);
  };

  useEffect(
    () => () => {
      if (pinTimer.current) clearTimeout(pinTimer.current);
    },
    []
  );

  const setQty = async (productId, quantity, product) => {
    const capped = clampOrderQty(quantity, product);
    try {
      await updateCartQuantity(productId, capped);
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update quantity'));
    }
  };

  const remove = async (productId) => {
    try {
      await removeFromCart(productId);
      toast.success('Item removed');
    } catch (err) {
      toast.error(friendlyError(err, 'Could not remove item'));
    }
  };

  const sendEnquiry = async (e) => {
    e?.preventDefault?.();
    if (!items.length) return;
    if (!isAuthenticated) {
      sessionStorage.setItem('mk_open_checkout', '1');
      requireLogin(
        'Please login first to send your enquiry. Your cart items will merge into your account after you sign in.',
        '/login',
        '/'
      );
      return;
    }

    const addressError = validateDeliveryAddress(billing);
    if (addressError) {
      toast.error(addressError);
      return;
    }

    setBusy(true);
    const toastId = toast.loading('Sending enquiry...');
    try {
      const isNew =
        selectedAddressId === 'new' ||
        !savedAddresses.some((a) => String(a._id) === String(selectedAddressId));
      const alreadySaved = savedAddresses.some((a) => addressesEqual(a, billing));

      if (isNew && !alreadySaved && billing.line1) {
        const { data } = await authService.addAddress({
          ...billing,
          label: savedAddresses.length ? 'Other' : 'Home',
          isDefault: savedAddresses.length === 0,
        });
        if (data.data?.user) applyUser(data.data.user);
      }

      const { data } = await orderService.place({
        billingAddress: billing,
        shippingAddress: billing,
      });
      const order = data.data.order;
      setBilling(emptyAddress);
      setSelectedAddressId('');
      await refreshCart();
      goToCartStep();
      closeCart();
      toast.success(
        order?.orderNumber
          ? `Enquiry ${order.orderNumber} sent successfully!`
          : 'Enquiry sent successfully!',
        { id: toastId }
      );
    } catch (err) {
      toast.error(friendlyError(err, 'Could not send enquiry. Please try again.'), {
        id: toastId,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] bg-black/35 backdrop-blur-[1px] transition-opacity duration-300 ${
          cartOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeCart}
        aria-hidden={!cartOpen}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[100] flex w-full max-w-md flex-col bg-[#f7f9fc] shadow-2xl transition-transform duration-300 pb-[env(safe-area-inset-bottom)] ${
          cartOpen
            ? 'pointer-events-auto translate-x-0'
            : 'pointer-events-none translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="My Cart"
        aria-hidden={!cartOpen}
      >
        <div className="flex items-center gap-2 border-b border-gray-200/80 bg-white px-4 py-3.5">
          <span className="w-8" />
          <h2 className="flex-1 text-center text-base font-bold text-gray-900">My Cart</h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!items.length ? (
            <EmptyCart
              onShop={() => {
                closeCart();
                navigate('/shop');
              }}
            />
          ) : (
            <form id="cart-enquiry-form" onSubmit={sendEnquiry} className="space-y-4 px-4 py-4">
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                <ul className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const p = item.product;
                    if (!p) return null;
                    const id = p.id || p._id;
                    return (
                      <li key={id} className="flex gap-3 p-3.5">
                        <Link
                          to={`/product/${p.slug}`}
                          onClick={closeCart}
                          className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-100"
                        >
                          <img
                            src={productImageUrl(p, 128)}
                            alt={formatProductTitle(p)}
                            className="h-full w-full object-contain p-1"
                            loading="lazy"
                            decoding="async"
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/product/${p.slug}`}
                              onClick={closeCart}
                              className="line-clamp-2 text-[13px] font-bold uppercase leading-snug text-gray-900"
                            >
                              {formatProductTitle(p)}
                            </Link>
                            <button
                              type="button"
                              onClick={() => remove(id)}
                              className="shrink-0 rounded-lg p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                              aria-label="Remove"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={item.quantity <= 1}
                              onClick={() => setQty(id, item.quantity - 1, p)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#78c6d4] text-white transition hover:bg-[#5bb5c6] disabled:opacity-35"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} strokeWidth={3} />
                            </button>
                            <CartQtyInput
                              quantity={item.quantity}
                              product={p}
                              onCommit={(next) => setQty(id, next, p)}
                            />
                            <button
                              type="button"
                              onClick={() => setQty(id, item.quantity + 1, p)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#78c6d4] text-white transition hover:bg-[#5bb5c6]"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="px-0.5 text-[11px] text-gray-400">
                {lineCount} item{lineCount === 1 ? '' : 's'}
                {itemCount !== lineCount ? ` · Total qty ${itemCount}` : ' in cart'}
              </p>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f4f8] text-[#1a4b8c]">
                    <MapPin size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Delivery address</h3>
                    <p className="text-[11px] text-gray-400">
                      {isAuthenticated
                        ? 'Choose saved or add a new one'
                        : 'Login to save and send your enquiry'}
                    </p>
                  </div>
                </div>

                {isAuthenticated ? (
                  <>
                    {savedAddresses.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {savedAddresses.map((addr) => {
                          const id = String(addr._id);
                          const selected = selectedAddressId === id;
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
                                    selected
                                      ? 'border-[#1a4b8c] bg-[#1a4b8c]'
                                      : 'border-gray-300'
                                  }`}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

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
                              value={billing.fullName}
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
                              value={billing.phone}
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
                              value={billing.line1}
                              onChange={(e) => setAddr('line1', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              placeholder="Landmark / line 2 (optional)"
                              className="input-mk rounded-xl border-cyan/30 bg-white py-2 text-sm"
                              value={billing.line2}
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
                                value={billing.postalCode}
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
                              value={billing.city}
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
                              value={billing.state}
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
                              value={billing.country}
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
                  </>
                ) : (
                  <p className="rounded-xl bg-[#f3f8fb] px-3 py-3 text-xs leading-relaxed text-gray-600">
                    Sign in to enter your address and send an enquiry for these products.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
            <button
              type="submit"
              form="cart-enquiry-form"
              disabled={busy}
              className="w-full rounded-2xl bg-[#1a4b8c] py-3.5 text-sm font-bold text-white transition hover:bg-[#143a6e] disabled:opacity-60"
            >
              {busy
                ? 'Sending...'
                : isAuthenticated
                  ? 'Send Enquiry'
                  : 'Login to Send Enquiry'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function CartQtyInput({ quantity, product, onCommit }) {
  const [text, setText] = useState(String(quantity));

  useEffect(() => {
    setText(String(quantity));
  }, [quantity]);

  const commit = (raw) => {
    const next = clampOrderQty(raw, product);
    setText(String(next));
    if (next !== Number(quantity)) onCommit(next);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label="Quantity"
      value={text}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
        setText(digits);
      }}
      onBlur={() => commit(text)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className="h-7 w-10 rounded-md border border-gray-200 bg-white text-center text-sm font-bold text-gray-900 outline-none focus:border-[#78c6d4] focus:ring-1 focus:ring-[#78c6d4]/40"
    />
  );
}

function EmptyCart({ onShop }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan/15 text-navy">
        <ShoppingBag size={36} />
      </div>
      <p className="text-lg font-bold text-gray-900">Your cart is empty</p>
      <p className="mt-1 text-sm text-gray-500">Add products to continue.</p>
      <button
        type="button"
        onClick={onShop}
        className="mt-6 rounded-2xl bg-[#1a4b8c] px-6 py-3 text-sm font-semibold text-white"
      >
        Continue shopping
      </button>
    </div>
  );
}
