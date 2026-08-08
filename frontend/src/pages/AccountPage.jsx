import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCartUI } from '../context/CartUIContext';
import { orderService } from '../services/order.service';
import { formatPrice } from '../utils/format';
import { friendlyError } from '../utils/toastMsg';
import { OrderStatusPill } from '../components/common/OrderReceipt';
import ReceiptModal from '../components/common/ReceiptModal';
import { canCustomerCancel, ORDER_FLOW, formatOrderStatus } from '../utils/orderStatusShared';

const ORDER_STATUSES = [
  'pending',
  'quotation_sent',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const PAGE_SIZE = 10;

export default function AccountPage() {
  const { user } = useAuth();
  const { openCart, openWishlist } = useCartUI();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [page, setPage] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.myOrders({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        sort,
        search: search.trim() || undefined,
      });
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0, limit: PAGE_SIZE });
    } catch (err) {
      toast.error(friendlyError(err, 'Could not load orders'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, paymentStatus, sort, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchDraft.trim();
      if (next === search) return;
      setPage(1);
      setSearch(next);
    }, 400);
    return () => clearTimeout(t);
  }, [searchDraft, search]);

  useEffect(() => {
    const orderId = searchParams.get('order');
    if (!orderId) return;
    (async () => {
      try {
        const { data } = await orderService.myOrder(orderId);
        setViewOrder(data.data.order);
      } catch {
        /* ignore */
      } finally {
        searchParams.delete('order');
        setSearchParams(searchParams, { replace: true });
      }
    })();
  }, [searchParams, setSearchParams]);

  const openOrder = async (order) => {
    try {
      const { data } = await orderService.myOrder(order._id);
      setViewOrder(data.data.order);
    } catch {
      setViewOrder(order);
    }
  };

  const handleCancel = async () => {
    if (!viewOrder || !canCustomerCancel(viewOrder.orderStatus)) return;
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    try {
      const { data } = await orderService.cancel(viewOrder._id);
      setViewOrder(data.data.order);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(friendlyError(err, 'Could not cancel order'));
    }
  };

  const stepIndex = (status) => ORDER_FLOW.indexOf(status);

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-[#eef4f9] via-white to-white">
      <div className="container-mk py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#78c6d4]">Account</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy">My Orders</h1>
            <p className="mt-1 text-sm text-gray-500">
              Hi {user?.firstName || 'there'} — track deliveries and view receipts
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCart}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Cart
            </button>
            <button
              type="button"
              onClick={openWishlist}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Wishlist
            </button>
            <Link
              to="/shop"
              className="rounded-xl bg-[#1a4b8c] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1a4b8c]/20 transition hover:-translate-y-0.5 hover:bg-[#143a6e]"
            >
              Shop more
            </Link>
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_10px_40px_rgba(26,75,140,0.08)] backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Search
            </label>
            <div className="relative">
              <Icon
                icon="bx:search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                width={18}
              />
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Order number..."
                className="input-mk rounded-xl py-2.5 pl-10 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Status
            </label>
            <select
              className="input-mk rounded-xl py-2.5 text-sm"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatOrderStatus(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Payment
            </label>
            <select
              className="input-mk rounded-xl py-2.5 text-sm"
              value={paymentStatus}
              onChange={(e) => {
                setPage(1);
                setPaymentStatus(e.target.value);
              }}
            >
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Sort
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'newest', label: 'Newest' },
                { value: 'oldest', label: 'Oldest' },
                { value: 'amount_desc', label: 'Amount ↓' },
                { value: 'amount_asc', label: 'Amount ↑' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setSort(opt.value);
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    sort === opt.value
                      ? 'bg-[#1a4b8c] text-white shadow-md shadow-[#1a4b8c]/25'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#78c6d4] border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f4f8] text-[#1a4b8c]">
              <Icon icon="bx:package" width={32} height={32} />
            </div>
            <p className="text-lg font-bold text-gray-900">No orders found</p>
            <p className="mt-1 text-sm text-gray-500">Try clearing filters or place your first order.</p>
            <Link
              to="/shop"
              className="mt-5 inline-flex rounded-xl bg-[#1a4b8c] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Browse shop
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o, idx) => (
              <button
                key={o._id}
                type="button"
                onClick={() => openOrder(o)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-[#78c6d4]/40 hover:shadow-[0_16px_40px_rgba(26,75,140,0.12)]"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a4b8c] to-[#78c6d4] text-white shadow-md">
                  <Icon icon="bx:receipt" width={22} height={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-bold text-gray-900">{o.orderNumber}</p>
                    <OrderStatusPill status={o.orderStatus} />
                    <OrderStatusPill status={o.paymentStatus} />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(o.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {o.orderStatus !== 'cancelled' && (
                    <div className="mt-2.5 flex items-center gap-1">
                      {ORDER_FLOW.map((step, i) => {
                        const cur = stepIndex(o.orderStatus);
                        const filled = cur >= i;
                        return (
                          <span
                            key={step}
                            title={step}
                            className={`h-1.5 flex-1 rounded-full ${
                              filled ? 'bg-[#1a4b8c]' : 'bg-gray-200'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-[#1a4b8c]">{formatPrice(o.total)}</p>
                  <p className="mt-1 text-[11px] font-semibold text-gray-400 transition group-hover:text-[#1a4b8c]">
                    View receipt →
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Prev
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === pagination.pages)
              .map((p, i, arr) => (
                <span key={p} className="contents">
                  {i > 0 && arr[i - 1] !== p - 1 ? (
                    <span className="px-1 text-gray-300">…</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-9 min-w-9 rounded-xl text-sm font-semibold transition ${
                      p === page
                        ? 'bg-[#1a4b8c] text-white shadow-md'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-gray-400">
          Showing {orders.length} of {pagination.total} orders · {PAGE_SIZE} per page
        </p>
      </div>

      <ReceiptModal
        open={Boolean(viewOrder)}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
        footer={
          viewOrder && canCustomerCancel(viewOrder.orderStatus) ? (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-2xl border border-rose-200 bg-white py-3 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
            >
              Cancel order
            </button>
          ) : null
        }
      />
    </div>
  );
}
