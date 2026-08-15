import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  FileText,
  Mail,
  MapPin,
  Phone,
  Save,
  Send,
  Truck,
  UserRound,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { friendlyError } from '../../utils/toastMsg';
import { GST_PERCENT_OPTIONS, formatOrderStatus } from '../../utils/orderStatusShared';
import { formatProductTitle } from '../../utils/productTitle';
import { productImageUrl } from '../../utils/productImage';

const PAGE_SIZE_OPTIONS = [3, 5, 10, 50];
const PAGE_PREF_KEY = 'mk:quotation-pageSize';
const CACHE_PREFIX = 'mk:quotation-local:';
const MAX_PAGE_SIZE = 200;

function cacheKey(orderId) {
  return `${CACHE_PREFIX}${orderId}`;
}

function readPageSizePref() {
  try {
    const n = Number(localStorage.getItem(PAGE_PREF_KEY));
    if (Number.isFinite(n) && n >= 1 && n <= MAX_PAGE_SIZE) return Math.floor(n);
  } catch {
    /* ignore */
  }
  return 3;
}

function writePageSizePref(n) {
  try {
    localStorage.setItem(PAGE_PREF_KEY, String(n));
  } catch {
    /* ignore */
  }
}

function readQuotationCache(orderId) {
  try {
    const raw = localStorage.getItem(cacheKey(orderId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeQuotationCache(orderId, payload) {
  try {
    localStorage.setItem(
      cacheKey(orderId),
      JSON.stringify({ ...payload, updatedAt: Date.now() })
    );
  } catch {
    /* ignore quota */
  }
}

function clearQuotationCache(orderId) {
  try {
    localStorage.removeItem(cacheKey(orderId));
  } catch {
    /* ignore */
  }
}

function clampPageSize(raw) {
  const n = Math.floor(Number(raw) || 0);
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(MAX_PAGE_SIZE, n);
}

function mapServerItems(rows) {
  return (rows || []).map((row) => ({
    product: row.product?._id || row.product || null,
    name: row.name || '',
    sku: row.sku || '',
    categoryName: row.categoryName || '',
    subcategoryName: row.subcategoryName || '',
    image: row.image || '',
    quantity: String(row.quantity || 1),
    amount: row.amount === 0 || row.amount == null ? '' : String(row.amount),
    discountValue:
      row.discountValue === 0 || row.discountValue == null ? '' : String(row.discountValue),
  }));
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** Allow free typing; keep digits and at most one decimal point. */
function sanitizeDecimal(raw) {
  const s = String(raw ?? '').replace(/[^\d.]/g, '');
  const parts = s.split('.');
  if (parts.length <= 1) return s;
  return `${parts[0]}.${parts.slice(1).join('')}`;
}

function sanitizeInt(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}

function lineDiscount(amount, quantity, discountType, discountValue) {
  const base = (Number(amount) || 0) * (Number(quantity) || 0);
  const val = Math.max(0, Number(discountValue) || 0);
  if (!val || discountType === 'none') return 0;
  if (discountType === 'percent') {
    return Math.round(Math.min(base, (base * Math.min(val, 100)) / 100) * 100) / 100;
  }
  if (discountType === 'amount') {
    return Math.round(Math.min(base, val) * 100) / 100;
  }
  return 0;
}

function computeTotals(items, courierCharges, gstPercent, discountType) {
  const itemsGross = items.reduce(
    (s, i) => s + (Number(i.amount) || 0) * (Number(i.quantity) || 0),
    0
  );
  const discountTotal = items.reduce(
    (s, i) =>
      s +
      lineDiscount(
        i.amount,
        i.quantity,
        Number(i.discountValue) > 0 ? discountType : 'none',
        i.discountValue
      ),
    0
  );
  const itemsSubtotal = Math.round((itemsGross - discountTotal) * 100) / 100;
  const courier = Math.max(0, Number(courierCharges) || 0);
  const taxable = Math.round((itemsSubtotal + courier) * 100) / 100;
  const gst = Math.round(((taxable * (Number(gstPercent) || 0)) / 100) * 100) / 100;
  const grandTotal = Math.round((taxable + gst) * 100) / 100;
  return {
    itemsGross: Math.round(itemsGross * 100) / 100,
    itemsSubtotal,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxableAmount: taxable,
    gstAmount: gst,
    grandTotal,
    courier,
  };
}

function formatAddress(addr = {}) {
  return [
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.postalCode,
    addr.country,
  ]
    .filter(Boolean)
    .join(', ');
}

function mergeOrderKeepUser(prev, next) {
  if (!next) return prev;
  const nextUser = typeof next.user === 'object' && next.user ? next.user : null;
  const prevUser = typeof prev?.user === 'object' && prev.user ? prev.user : null;
  if (nextUser?.email) return next;
  if (prevUser) return { ...next, user: prevUser };
  return next;
}

const fieldClass =
  'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-[#1a4b8c] focus:ring-2 focus:ring-[#1a4b8c]/15 disabled:bg-gray-50 disabled:text-gray-500';

export default function AdminQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [items, setItems] = useState([]);
  const [courierCharges, setCourierCharges] = useState('0');
  const [gstPercent, setGstPercent] = useState(0);
  const [discountType, setDiscountType] = useState('percent');
  const [pageSize, setPageSize] = useState(() => readPageSizePref());
  const [customPageSize, setCustomPageSize] = useState('');
  const [page, setPage] = useState(1);
  const [gotoDraft, setGotoDraft] = useState('1');
  const [localDraftRestored, setLocalDraftRestored] = useState(false);
  const cacheReady = useRef(false);
  const readOnly = order?.quotation?.status === 'sent';

  useEffect(() => {
    let cancelled = false;
    cacheReady.current = false;
    (async () => {
      setLoading(true);
      setLocalDraftRestored(false);
      try {
        const { data } = await adminService.getQuotation(id);
        if (cancelled) return;
        const o = data.data.order;
        const q = data.data.quotation || {};
        const alreadySent = q.status === 'sent';
        setOrder(o);

        const serverItems = mapServerItems(q.items?.length ? q.items : o.items || []);
        const serverCourier =
          q.courierCharges === 0 || q.courierCharges == null ? '0' : String(q.courierCharges);
        const serverGst = q.gstPercent || 0;
        const fromItem = (q.items || []).find(
          (i) => i.discountType === 'amount' || i.discountType === 'percent'
        );
        const serverDiscountType =
          q.discountType === 'amount' || q.discountType === 'percent'
            ? q.discountType
            : fromItem?.discountType === 'amount'
              ? 'amount'
              : 'percent';

        let nextItems = serverItems;
        let nextCourier = serverCourier;
        let nextGst = serverGst;
        let nextDiscountType = serverDiscountType;

        if (!alreadySent) {
          const cached = readQuotationCache(id);
          const serverSavedAt = q.savedAt ? new Date(q.savedAt).getTime() : 0;
          if (cached?.items && Array.isArray(cached.items) && cached.updatedAt > serverSavedAt) {
            nextItems = cached.items;
            nextCourier =
              cached.courierCharges === 0 || cached.courierCharges == null
                ? '0'
                : String(cached.courierCharges);
            nextGst = Number(cached.gstPercent) || 0;
            nextDiscountType =
              cached.discountType === 'amount' || cached.discountType === 'percent'
                ? cached.discountType
                : serverDiscountType;
            setLocalDraftRestored(true);
            toast.success('Restored unsaved quotation edits from this browser', {
              duration: 3500,
            });
          } else {
            clearQuotationCache(id);
          }
        } else {
          clearQuotationCache(id);
        }

        setItems(nextItems);
        setCourierCharges(nextCourier);
        setGstPercent(nextGst);
        setDiscountType(nextDiscountType);
        setPage(1);
        setGotoDraft('1');
        cacheReady.current = true;
      } catch (err) {
        toast.error(friendlyError(err, 'Could not load quotation'));
        navigate('/admin/orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // Persist unsaved quotation edits locally (survives refresh)
  useEffect(() => {
    if (!id || loading || readOnly || !cacheReady.current) return undefined;
    const t = setTimeout(() => {
      writeQuotationCache(id, {
        items,
        courierCharges,
        gstPercent,
        discountType,
      });
    }, 350);
    return () => clearTimeout(t);
  }, [id, loading, readOnly, items, courierCharges, gstPercent, discountType]);

  const totals = useMemo(
    () => computeTotals(items, courierCharges, gstPercent, discountType),
    [items, courierCharges, gstPercent, discountType]
  );

  const safePageSize = clampPageSize(pageSize);
  const pages = Math.max(1, Math.ceil(items.length / safePageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const slice = useMemo(() => {
    const start = (safePage - 1) * safePageSize;
    return items
      .map((item, globalIdx) => ({ item, globalIdx }))
      .slice(start, start + safePageSize);
  }, [items, safePage, safePageSize]);

  const from = items.length === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const to = Math.min(safePage * safePageSize, items.length);

  useEffect(() => {
    setGotoDraft(String(safePage));
  }, [safePage]);

  const applyPageSize = (raw) => {
    const next = clampPageSize(raw);
    setPageSize(next);
    writePageSizePref(next);
    setPage(1);
    setCustomPageSize('');
  };

  const payload = () => ({
    items: items.map((i) => ({
      product: i.product,
      name: i.name,
      sku: i.sku,
      categoryName: i.categoryName || '',
      subcategoryName: i.subcategoryName || '',
      image: i.image || '',
      quantity: Math.max(1, Number(i.quantity) || 1),
      amount: Number(i.amount) || 0,
      discountValue: Number(i.discountValue) || 0,
    })),
    courierCharges: Number(courierCharges) || 0,
    gstPercent: Number(gstPercent) || 0,
    discountType,
  });

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const saveDraft = async () => {
    setBusy('draft');
    const toastId = toast.loading('Saving draft...');
    try {
      const { data } = await adminService.saveQuotationDraft(id, payload());
      setOrder((prev) => mergeOrderKeepUser(prev, data.data.order));
      clearQuotationCache(id);
      setLocalDraftRestored(false);
      toast.success('Draft saved — you can leave and continue later', { id: toastId });
    } catch (err) {
      toast.error(friendlyError(err, 'Could not save draft'), { id: toastId });
    } finally {
      setBusy('');
    }
  };

  const sendQuote = async () => {
    setBusy('send');
    const toastId = toast.loading('Creating and sending quotation...');
    try {
      await adminService.sendQuotation(id, payload());
      clearQuotationCache(id);
      toast.success('Quotation sent — status is Quotation Sent', { id: toastId });
      navigate('/admin/orders');
    } catch (err) {
      toast.error(friendlyError(err, 'Could not send quotation'), { id: toastId });
    } finally {
      setBusy('');
    }
  };

  if (loading || !order) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </div>
    );
  }

  const user = typeof order.user === 'object' && order.user ? order.user : {};
  const customerName =
    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
    user.companyName ||
    order.shippingAddress?.fullName ||
    order.billingAddress?.fullName ||
    '—';
  const customerEmail = user.email || '';
  const isCorporate = user.role === 'corporate' || user.role === 'dealer';
  const customerTypeLabel = isCorporate ? 'Corporate' : 'Normal';
  const addr = order.shippingAddress || order.billingAddress || {};
  const qStatus = order.quotation?.status || 'none';

  return (
    <div className="mx-auto max-w-6xl">
      {/* Hero header */}
      <div className="mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a4b8c] via-[#1e5a9e] to-[#0f172a] px-4 py-3 text-white shadow-lg sm:px-5">
        <Link
          to="/admin/orders"
          className="mb-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-white/70 transition hover:text-white"
        >
          <ArrowLeft size={12} />
          Back to orders
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {readOnly ? 'View quotation' : 'Create quotation'}
            </h1>
            <p className="mt-0.5 font-mono text-sm text-cyan/90">{order.orderNumber}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-white/20">
              {formatOrderStatus(order.orderStatus)}
            </span>
            {qStatus === 'draft' && (
              <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-100 ring-1 ring-amber-300/30">
                Draft
              </span>
            )}
            {readOnly && (
              <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 ring-1 ring-emerald-300/30">
                Sent
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {/* Customer */}
          <section className="rounded-2xl border border-gray-100/80 bg-white p-3.5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex min-w-[200px] flex-1 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a4b8c] to-[#78c6d4] text-white shadow-md">
                  <UserRound size={18} />
                </span>
                <div className="min-w-0 space-y-1.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Customer
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isCorporate
                            ? 'bg-[#e8f4f8] text-navy ring-1 ring-[#1a4b8c]/15'
                            : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
                        }`}
                      >
                        {customerTypeLabel}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{customerName}</p>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Mail size={14} className="shrink-0 text-[#1a4b8c]" />
                    <span className="break-all">{customerEmail || 'No email on file'}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Phone size={14} className="shrink-0 text-[#1a4b8c]" />
                    {addr.phone || user.phone || '—'}
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex-1 rounded-xl bg-[#f3f8fb] px-3 py-2.5">
                <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-navy">
                  <MapPin size={11} />
                  Enquiry address
                </p>
                <p className="text-xs leading-relaxed text-gray-700 sm:text-sm">
                  {formatAddress(addr) || '—'}
                </p>
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="overflow-hidden rounded-2xl border border-gray-100/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f4f8] text-navy">
                  <FileText size={15} />
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">Enquiry items</p>
                  <p className="text-[11px] text-gray-400">
                    {items.length} item{items.length === 1 ? '' : 's'}
                    {localDraftRestored && !readOnly ? (
                      <span className="ml-1 text-amber-600">· local draft</span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                <span className="font-medium">Per page</span>
                <select
                  value={
                    customPageSize !== '' || !PAGE_SIZE_OPTIONS.includes(safePageSize)
                      ? 'custom'
                      : String(safePageSize)
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'custom') {
                      setCustomPageSize(String(safePageSize));
                      return;
                    }
                    applyPageSize(v);
                  }}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-navy outline-none"
                  aria-label="Items per page"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
                {(!PAGE_SIZE_OPTIONS.includes(safePageSize) || customPageSize !== '') && (
                  <form
                    className="flex items-center gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      applyPageSize(customPageSize || safePageSize);
                    }}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customPageSize}
                      onChange={(e) => setCustomPageSize(sanitizeInt(e.target.value))}
                      placeholder="e.g. 7"
                      className="w-14 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs font-semibold outline-none focus:border-navy"
                      aria-label="Custom items per page"
                    />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-lg bg-navy px-2 py-1.5 text-[10px] font-bold uppercase text-white"
                    >
                      Set
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="max-h-[220px] overflow-y-auto sm:max-h-[240px]">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
                    <th className="px-3 py-2.5 font-semibold">#</th>
                    <th className="px-3 py-2.5 font-semibold">Product</th>
                    <th className="px-3 py-2.5 font-semibold">Qty</th>
                    <th className="px-3 py-2.5 font-semibold">Amount</th>
                    <th className="px-3 py-2.5 font-semibold normal-case tracking-normal">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Discount
                        </p>
                        <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
                          {[
                            { id: 'percent', label: '%' },
                            { id: 'amount', label: '₹' },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={readOnly}
                              onClick={() => setDiscountType(opt.id)}
                              className={`min-w-[28px] cursor-pointer rounded-md px-1.5 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed ${
                                discountType === opt.id
                                  ? 'bg-white text-navy shadow-sm'
                                  : 'text-gray-500 hover:text-gray-800'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">Item price</th>
                    <th className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">Disc. Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {slice.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-sm text-gray-400">
                        No items
                      </td>
                    </tr>
                  ) : (
                    slice.map(({ item, globalIdx }) => {
                      const itemPrice =
                        Math.round(
                          (Number(item.amount) || 0) * (Number(item.quantity) || 0) * 100
                        ) / 100;
                      const disc = lineDiscount(
                        item.amount,
                        item.quantity,
                        Number(item.discountValue) > 0 ? discountType : 'none',
                        item.discountValue
                      );
                      const afterDiscount = Math.round((itemPrice - disc) * 100) / 100;
                      const thumb = productImageUrl({
                        images: item.image ? [item.image] : [],
                      });
                      return (
                        <tr key={`${item.sku}-${globalIdx}`} className="align-middle hover:bg-[#fafbfd]">
                          <td className="px-3 py-2 text-xs text-gray-400">{globalIdx + 1}</td>
                          <td className="px-3 py-2">
                            <div className="flex max-w-[260px] items-center gap-2">
                              <img
                                src={thumb}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-md border border-gray-100 object-cover bg-gray-50"
                              />
                              <p className="text-sm font-semibold leading-snug text-gray-900">
                                {formatProductTitle(item)}
                              </p>
                            </div>
                          </td>
                          <td className="w-14 px-2 py-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              disabled={readOnly}
                              className="w-11 rounded-lg border border-gray-200 bg-white px-1 py-1.5 text-center text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-[#1a4b8c] focus:ring-2 focus:ring-[#1a4b8c]/15 disabled:bg-gray-50 disabled:text-gray-500"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(globalIdx, { quantity: sanitizeInt(e.target.value) })
                              }
                              placeholder="1"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="relative w-[100px]">
                              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                ₹
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={readOnly}
                                className={`${fieldClass} pl-6`}
                                value={item.amount}
                                onChange={(e) =>
                                  updateItem(globalIdx, {
                                    amount: sanitizeDecimal(e.target.value),
                                  })
                                }
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="relative w-[72px]">
                              {discountType === 'amount' && (
                                <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                                  ₹
                                </span>
                              )}
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={readOnly}
                                className={`w-full rounded-lg border border-gray-200 bg-white py-1.5 text-center text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-[#1a4b8c] focus:ring-2 focus:ring-[#1a4b8c]/15 disabled:bg-gray-50 disabled:text-gray-500 ${
                                  discountType === 'amount' ? 'pl-5 pr-1' : 'px-1'
                                }`}
                                value={item.discountValue}
                                onChange={(e) =>
                                  updateItem(globalIdx, {
                                    discountValue: sanitizeDecimal(e.target.value),
                                  })
                                }
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                            {money(itemPrice)}
                          </td>
                          <td className="px-3 py-2 text-right text-sm font-bold text-navy">
                            {money(afterDiscount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-[#fafbfd] px-3 py-2.5 sm:px-4">
              <p className="text-xs text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700">
                  {from}–{to}
                </span>{' '}
                of <span className="font-semibold text-gray-700">{items.length}</span>
                <span className="text-gray-400"> · {safePageSize}/page</span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-1 text-xs font-medium text-gray-500">
                  Page {safePage} / {pages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-40"
                >
                  Next
                </button>
                <form
                  className="ml-1 flex items-center gap-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = Math.min(pages, Math.max(1, Number(gotoDraft) || 1));
                    setPage(n);
                  }}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={gotoDraft}
                    onChange={(e) => setGotoDraft(sanitizeInt(e.target.value))}
                    className="w-12 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs font-semibold outline-none focus:border-navy"
                    aria-label="Go to page"
                  />
                  <button
                    type="submit"
                    className="cursor-pointer rounded-lg bg-navy px-2.5 py-1.5 text-[10px] font-bold uppercase text-white"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="space-y-3 lg:sticky lg:top-0">
            <section className="rounded-2xl border border-gray-100/80 bg-white p-3.5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <Truck size={15} className="text-navy" />
                <p className="text-sm font-bold text-gray-900">Charges</p>
              </div>

              <label className="mb-1 block text-xs font-medium text-gray-600">Courier (₹)</label>
              <div className="relative mb-4">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={readOnly}
                  className={`${fieldClass} py-2.5 pl-7`}
                  value={courierCharges}
                  onChange={(e) => setCourierCharges(sanitizeDecimal(e.target.value))}
                  placeholder="0"
                />
              </div>

              <p className="mb-2 text-xs font-medium text-gray-600">GST rate</p>
              <div className="grid grid-cols-5 gap-1.5">
                {GST_PERCENT_OPTIONS.map((p) => {
                  const active = Number(gstPercent) === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={readOnly}
                      onClick={() => setGstPercent(p)}
                      className={`cursor-pointer rounded-xl py-2.5 text-xs font-bold transition disabled:cursor-not-allowed ${
                        active
                          ? 'bg-[#1a4b8c] text-white shadow-md shadow-[#1a4b8c]/25'
                          : 'bg-[#f3f8fb] text-navy hover:bg-[#e8f4f8]'
                      }`}
                    >
                      {p}%
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#1a4b8c]/10 bg-gradient-to-br from-[#1a4b8c] to-[#143a6e] p-3.5 text-white shadow-lg sm:p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                Quotation total
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Items subtotal</span>
                  <span className="font-medium text-white">{money(totals.itemsGross)}</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-cyan/90">
                    <span>Discount</span>
                    <span className="font-medium">{money(totals.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/80">
                  <span>Courier</span>
                  <span className="font-medium text-white">{money(totals.courier)}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>GST ({gstPercent}%)</span>
                  <span className="font-medium text-white">{money(totals.gstAmount)}</span>
                </div>
                <div className="flex items-end justify-between border-t border-white/20 pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-cyan">
                    Grand total
                  </span>
                  <span className="text-2xl font-bold tracking-tight">{money(totals.grandTotal)}</span>
                </div>
              </div>
            </section>

            {!readOnly && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={saveDraft}
                  className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-2.5 py-2.5 text-xs font-semibold text-navy shadow-sm transition hover:border-navy/30 hover:bg-[#f8fafc] disabled:opacity-60 sm:text-sm"
                >
                  <Save size={14} className="shrink-0" />
                  <span className="truncate">{busy === 'draft' ? 'Saving...' : 'Save as draft'}</span>
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={sendQuote}
                  className="inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#1a4b8c] px-2.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#1a4b8c]/25 transition hover:bg-[#143a6e] disabled:opacity-60 sm:text-sm"
                >
                  <Send size={14} className="shrink-0" />
                  <span className="truncate">{busy === 'send' ? 'Sending...' : 'Create and send'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
