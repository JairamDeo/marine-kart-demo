import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  FileText,
  FilePlus2,
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

const PAGE_SIZE = 10;

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
  if (discountType === 'percent') return Math.min(base, (base * Math.min(val, 100)) / 100);
  if (discountType === 'amount') return Math.min(base, val);
  return 0;
}

function computeTotals(items, courierCharges, gstPercent) {
  const itemsGross = items.reduce(
    (s, i) => s + (Number(i.amount) || 0) * (Number(i.quantity) || 0),
    0
  );
  const discountTotal = items.reduce(
    (s, i) => s + lineDiscount(i.amount, i.quantity, i.discountType, i.discountValue),
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
  const [page, setPage] = useState(1);
  const [gotoDraft, setGotoDraft] = useState('1');
  const readOnly = order?.quotation?.status === 'sent';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await adminService.getQuotation(id);
        if (cancelled) return;
        const o = data.data.order;
        const q = data.data.quotation || {};
        setOrder(o);
        setItems(
          (q.items?.length ? q.items : o.items || []).map((row) => ({
            product: row.product?._id || row.product || null,
            name: row.name || '',
            sku: row.sku || '',
            categoryName: row.categoryName || '',
            subcategoryName: row.subcategoryName || '',
            quantity: String(row.quantity || 1),
            amount: row.amount === 0 || row.amount == null ? '' : String(row.amount),
            discountType: row.discountType || 'none',
            discountValue:
              row.discountValue === 0 || row.discountValue == null
                ? ''
                : String(row.discountValue),
          }))
        );
        setCourierCharges(
          q.courierCharges === 0 || q.courierCharges == null ? '0' : String(q.courierCharges)
        );
        setGstPercent(q.gstPercent || 0);
        setPage(1);
        setGotoDraft('1');
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

  const totals = useMemo(
    () => computeTotals(items, courierCharges, gstPercent),
    [items, courierCharges, gstPercent]
  );

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const slice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return items
      .map((item, globalIdx) => ({ item, globalIdx }))
      .slice(start, start + PAGE_SIZE);
  }, [items, safePage]);
  const from = items.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, items.length);

  useEffect(() => {
    setGotoDraft(String(safePage));
  }, [safePage]);

  const payload = () => ({
    items: items.map((i) => ({
      product: i.product,
      name: i.name,
      sku: i.sku,
      categoryName: i.categoryName || '',
      subcategoryName: i.subcategoryName || '',
      quantity: Math.max(1, Number(i.quantity) || 1),
      amount: Number(i.amount) || 0,
      discountType: i.discountType || 'none',
      discountValue: Number(i.discountValue) || 0,
    })),
    courierCharges: Number(courierCharges) || 0,
    gstPercent: Number(gstPercent) || 0,
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
      toast.success('Draft saved — you can leave and continue later', { id: toastId });
    } catch (err) {
      toast.error(friendlyError(err, 'Could not save draft'), { id: toastId });
    } finally {
      setBusy('');
    }
  };

  const createQuote = async () => {
    setBusy('create');
    const toastId = toast.loading('Creating quotation...');
    try {
      const { data } = await adminService.createQuotation(id, payload());
      setOrder((prev) => mergeOrderKeepUser(prev, data.data.order));
      toast.success('Quotation created. Use Create and send when ready.', { id: toastId });
    } catch (err) {
      toast.error(friendlyError(err, 'Could not create quotation'), { id: toastId });
    } finally {
      setBusy('');
    }
  };

  const sendQuote = async () => {
    setBusy('send');
    const toastId = toast.loading('Creating and sending quotation...');
    try {
      await adminService.sendQuotation(id, payload());
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
  const addr = order.shippingAddress || order.billingAddress || {};
  const qStatus = order.quotation?.status || 'none';

  return (
    <div className="mx-auto max-w-6xl pb-20">
      {/* Hero header */}
      <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a4b8c] via-[#1e5a9e] to-[#0f172a] px-5 py-4 text-white shadow-lg sm:px-6">
        <Link
          to="/admin/orders"
          className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-white/70 transition hover:text-white"
        >
          <ArrowLeft size={12} />
          Back to orders
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {readOnly ? 'View quotation' : 'Create quotation'}
            </h1>
            <p className="mt-1 font-mono text-sm text-cyan/90">{order.orderNumber}</p>
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

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          {/* Customer */}
          <section className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-wrap gap-4">
              <div className="flex min-w-[200px] flex-1 items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a4b8c] to-[#78c6d4] text-white shadow-md">
                  <UserRound size={18} />
                </span>
                <div className="min-w-0 space-y-1.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Customer
                    </p>
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
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f4f8] text-navy">
                  <FileText size={16} />
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">Enquiry items</p>
                  <p className="text-[11px] text-gray-400">
                    {items.length} item{items.length === 1 ? '' : 's'} · {PAGE_SIZE} per page
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
                    <th className="px-3 py-2.5 font-semibold">#</th>
                    <th className="px-3 py-2.5 font-semibold">Product</th>
                    <th className="px-3 py-2.5 font-semibold">Qty</th>
                    <th className="px-3 py-2.5 font-semibold">Amount</th>
                    <th className="px-3 py-2.5 font-semibold">Discount</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Item price</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Discounted price</th>
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
                      const disc = lineDiscount(
                        item.amount,
                        item.quantity,
                        item.discountType,
                        item.discountValue
                      );
                      const itemPrice =
                        Math.round(
                          (Number(item.amount) || 0) * (Number(item.quantity) || 0) * 100
                        ) / 100;
                      const discountedPrice = Math.round((itemPrice - disc) * 100) / 100;
                      return (
                        <tr key={`${item.sku}-${globalIdx}`} className="align-top hover:bg-[#fafbfd]">
                          <td className="px-3 py-3 text-xs text-gray-400">{globalIdx + 1}</td>
                          <td className="px-3 py-3">
                            <p className="max-w-[220px] text-sm font-semibold leading-snug text-gray-900">
                              {item.name}
                            </p>
                            {item.categoryName ? (
                              <p className="mt-0.5 text-[11px] font-medium text-navy/80">
                                {item.categoryName}
                                {item.subcategoryName ? ` · ${item.subcategoryName}` : ''}
                              </p>
                            ) : null}
                            {item.sku ? (
                              <p className="mt-0.5 font-mono text-[10px] text-gray-400">{item.sku}</p>
                            ) : null}
                          </td>
                          <td className="w-14 px-2 py-3">
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
                          <td className="px-3 py-3">
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
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <div className="inline-flex shrink-0 rounded-lg bg-gray-100 p-0.5">
                                {[
                                  { id: 'none', label: 'Off' },
                                  { id: 'percent', label: '%' },
                                  { id: 'amount', label: '₹' },
                                ].map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    disabled={readOnly}
                                    onClick={() =>
                                      updateItem(globalIdx, {
                                        discountType: opt.id,
                                        discountValue:
                                          opt.id === 'none' ? '' : item.discountValue,
                                      })
                                    }
                                    className={`min-w-[32px] cursor-pointer rounded-md px-1.5 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed ${
                                      item.discountType === opt.id
                                        ? 'bg-white text-navy shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              {item.discountType !== 'none' && (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  disabled={readOnly}
                                  className="w-14 rounded-lg border border-gray-200 bg-white px-1.5 py-1.5 text-center text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-[#1a4b8c] focus:ring-2 focus:ring-[#1a4b8c]/15 disabled:bg-gray-50 disabled:text-gray-500"
                                  value={item.discountValue}
                                  onChange={(e) =>
                                    updateItem(globalIdx, {
                                      discountValue: sanitizeDecimal(e.target.value),
                                    })
                                  }
                                  placeholder={item.discountType === 'percent' ? '10' : '100'}
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-semibold text-gray-700">
                            {money(itemPrice)}
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-bold text-navy">
                            {money(discountedPrice)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 bg-[#fafbfd] px-3 py-2.5 sm:px-4">
              <p className="text-xs text-gray-500">
                Showing{' '}
                <span className="font-semibold text-gray-700">
                  {from}–{to}
                </span>{' '}
                of <span className="font-semibold text-gray-700">{items.length}</span>
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
          <div className="space-y-4 lg:sticky lg:top-0">
            <section className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-5">
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

            <section className="overflow-hidden rounded-2xl border border-[#1a4b8c]/10 bg-gradient-to-br from-[#1a4b8c] to-[#143a6e] p-4 text-white shadow-lg sm:p-5">
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
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100/80 bg-white px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:px-5">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={saveDraft}
            className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:border-navy/30 hover:bg-[#f8fafc] disabled:opacity-60"
          >
            <Save size={15} className="shrink-0" />
            {busy === 'draft' ? 'Saving...' : 'Save draft'}
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={createQuote}
              className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#1a4b8c]/30 bg-[#e8f4f8] px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-[#d9eef5] disabled:opacity-60"
            >
              <FilePlus2 size={15} className="shrink-0" />
              {busy === 'create' ? 'Creating...' : 'Create quotation'}
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={sendQuote}
              className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1a4b8c] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1a4b8c]/25 transition hover:bg-[#143a6e] disabled:opacity-60"
            >
              <Send size={15} className="shrink-0" />
              {busy === 'send' ? 'Sending...' : 'Create and send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
