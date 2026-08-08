import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import DataTable from '../../components/portal/DataTable';
import { FilterSelect } from '../../components/portal/FilterBar';
import ActionIcon, { ActionGroup } from '../../components/portal/ActionIcon';
import { OrderStatusPill } from '../../components/common/OrderReceipt';
import ReceiptModal from '../../components/common/ReceiptModal';
import ConfirmDialog from '../../components/portal/ConfirmDialog';
import { orderService } from '../../services/order.service';
import { formatPrice } from '../../utils/format';
import { friendlyError } from '../../utils/toastMsg';
import { canCustomerCancel, formatOrderStatus } from '../../utils/orderStatusShared';

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

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CorporateOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewOrder, setViewOrder] = useState(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  const dateRange = useMemo(() => {
    if (!dateFilter) return {};
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const cut =
      dateFilter === '7d' ? now - 7 * day : dateFilter === '30d' ? now - 30 * day : now - 90 * day;
    return { from: new Date(cut).toISOString() };
  }, [dateFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getMyOrders({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        sort,
        ...dateRange,
      });
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(friendlyError(err, 'Could not load orders'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentFilter, sort, dateRange]);

  useEffect(() => {
    load();
  }, [load]);

  const openOrder = async (row) => {
    try {
      const { data } = await orderService.myOrder(row._id);
      setViewOrder(data.data.order);
    } catch {
      setViewOrder(row);
    }
  };

  const handleCancel = async () => {
    if (!viewOrder || !canCustomerCancel(viewOrder.orderStatus)) return;
    setCancelBusy(true);
    try {
      const { data } = await orderService.cancel(viewOrder._id);
      setViewOrder(data.data.order);
      setCancelConfirmOpen(false);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(friendlyError(err, 'Could not cancel order'));
    } finally {
      setCancelBusy(false);
    }
  };

  const summary = useMemo(() => {
    const open = orders.filter((o) => !['delivered', 'cancelled'].includes(o.orderStatus)).length;
    const totalSpend = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    return { count: pagination.total, open, totalSpend };
  }, [orders, pagination.total]);

  const columns = [
    {
      header: 'Order ID',
      render: (row) => <span className="font-mono font-semibold text-navy">{row.orderNumber}</span>,
    },
    {
      header: 'Date',
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Items',
      render: (row) => <span className="text-sm text-gray-600">{row.items?.length || 0}</span>,
    },
    {
      header: 'Amount',
      render: (row) => (
        <span className="font-semibold text-gray-900">{formatPrice(row.total)}</span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <OrderStatusPill status={row.orderStatus} />,
    },
    {
      header: 'Payment',
      render: (row) => <OrderStatusPill status={row.paymentStatus} />,
    },
    {
      header: 'Action',
      render: (row) => (
        <ActionGroup>
          <ActionIcon variant="view" title="View receipt" onClick={() => openOrder(row)} />
        </ActionGroup>
      ),
    },
  ];

  const emptyState = (
    <div className="flex flex-col items-center gap-3 text-gray-400">
      <Icon icon="bx:package" className="h-12 w-12 opacity-40" />
      <p className="text-base font-medium text-gray-500">No orders found</p>
      <p className="text-sm">Try clearing filters, or check back after placing an order.</p>
    </div>
  );

  if (loading && !orders.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Orders</h1>
          <p className="mt-1 text-sm text-gray-400">Track and filter your order history</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total orders</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.count}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">On this page · open</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{summary.open}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Page value</p>
          <p className="mt-1 text-2xl font-bold text-navy">{formatPrice(summary.totalSpend)}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchKeys={['orderNumber']}
        searchPlaceholder="Search orders..."
        sortOptions={[]}
        emptyState={emptyState}
        filters={
          <>
            <FilterSelect
              ariaLabel="Order status"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="w-[140px]"
            >
              <option value="">Status</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatOrderStatus(s)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              ariaLabel="Payment"
              value={paymentFilter}
              onChange={(e) => {
                setPage(1);
                setPaymentFilter(e.target.value);
              }}
              className="w-[140px]"
            >
              <option value="">Payment</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              ariaLabel="Date range"
              value={dateFilter}
              onChange={(e) => {
                setPage(1);
                setDateFilter(e.target.value);
              }}
              className="w-[140px]"
            >
              <option value="">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </FilterSelect>
            <FilterSelect
              ariaLabel="Sort"
              value={sort}
              onChange={(e) => {
                setPage(1);
                setSort(e.target.value);
              }}
              className="w-[140px]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount_desc">Amount ↓</option>
              <option value="amount_asc">Amount ↑</option>
            </FilterSelect>
          </>
        }
      />

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-sm text-gray-500">
            Page {pagination.page} / {pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <ReceiptModal
        open={Boolean(viewOrder)}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
        footer={
          viewOrder && canCustomerCancel(viewOrder.orderStatus) ? (
            <button
              type="button"
              onClick={() => setCancelConfirmOpen(true)}
              className="w-full cursor-pointer rounded-2xl border border-rose-200 bg-white py-3 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
            >
              Cancel order
            </button>
          ) : null
        }
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleCancel}
        title="Cancel this order?"
        message="This cannot be undone. You cannot cancel after the order is shipped."
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        busyLabel="Cancelling..."
        busy={cancelBusy}
      />
    </div>
  );
}
