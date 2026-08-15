import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import DataTable from '../../components/portal/DataTable';
import { FilterSelect } from '../../components/portal/FilterBar';
import ActionIcon, { ActionGroup } from '../../components/portal/ActionIcon';
import { OrderStatusPill } from '../../components/common/OrderReceipt';
import ReceiptModal from '../../components/common/ReceiptModal';
import ConfirmDialog from '../../components/portal/ConfirmDialog';
import { orderService } from '../../services/order.service';
import { friendlyError } from '../../utils/toastMsg';
import { canCustomerCancel, FILTERABLE_ORDER_STATUSES, formatOrderStatus } from '../../utils/orderStatusShared';

const PAGE_SIZE = 10;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function CustomerOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewOrder, setViewOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
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
  }, [page, statusFilter, sort, dateRange]);

  useEffect(() => {
    load();
  }, [load]);

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

  const openOrder = async (row) => {
    try {
      const { data } = await orderService.myOrder(row._id);
      setViewOrder(data.data.order);
    } catch {
      setViewOrder(row);
    }
  };

  const handleCancel = async (reasonFromDialog) => {
    if (!viewOrder || !canCustomerCancel(viewOrder.orderStatus)) return;
    const reason = String(reasonFromDialog || rejectReason || '').trim();
    if (reason.length < 3) {
      toast.error('Please enter a reason (at least 3 characters).');
      return;
    }
    setCancelBusy(true);
    try {
      const { data } = await orderService.cancel(viewOrder._id, { reason });
      setViewOrder(data.data.order);
      setCancelConfirmOpen(false);
      setRejectReason('');
      toast.success('Order rejected');
      load();
    } catch (err) {
      toast.error(friendlyError(err, 'Could not reject order'));
    } finally {
      setCancelBusy(false);
    }
  };

  const summary = useMemo(() => {
    const open = orders.filter(
      (o) => !['order_received', 'delivered', 'cancelled'].includes(o.orderStatus)
    ).length;
    return { count: pagination.total, open };
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
      header: 'Status',
      render: (row) => <OrderStatusPill status={row.orderStatus} forCustomer />,
    },
    {
      header: 'Quotation',
      render: (row) =>
        row.quotation?.status === 'sent' || row.orderStatus === 'quotation_sent' ? (
          <span className="inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700 ring-1 ring-orange-200">
            Available
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      header: 'Action',
      render: (row) => {
        const hasQuote =
          row.quotation?.status === 'sent' || row.orderStatus === 'quotation_sent';
        return (
          <ActionGroup>
            <ActionIcon
              variant="view"
              title={hasQuote ? 'View quotation' : 'View receipt'}
              onClick={() => openOrder(row)}
            />
          </ActionGroup>
        );
      },
    },
  ];

  const emptyState = (
    <div className="flex flex-col items-center gap-3 text-gray-400">
      <Icon icon="bx:package" className="h-12 w-12 opacity-40" />
      <p className="text-base font-medium text-gray-500">No orders found</p>
      <p className="text-sm">Try clearing filters, or place an order from the shop.</p>
    </div>
  );

  if (loading && !orders.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Orders</h1>
        <p className="mt-1 text-sm text-gray-400">Track status, view receipts, and filter history</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Total orders</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.count}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">On this page · open</p>
          <p className="mt-1 text-2xl font-bold text-navy">{summary.open}</p>
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
              className="w-full min-[480px]:w-[140px]"
            >
              <option value="">All</option>
              {FILTERABLE_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatOrderStatus(s, { forCustomer: true })}
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
              className="w-full min-[480px]:w-[140px]"
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
              className="w-full min-[480px]:w-[140px]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
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
            className="cursor-pointer rounded-xl border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
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
            className="cursor-pointer rounded-xl border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <ReceiptModal
        open={Boolean(viewOrder)}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
        forCustomer
        footer={
          viewOrder && canCustomerCancel(viewOrder.orderStatus) ? (
            <button
              type="button"
              onClick={() => setCancelConfirmOpen(true)}
              className="w-full cursor-pointer rounded-2xl border border-rose-200 bg-white py-3 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
            >
              Reject order
            </button>
          ) : null
        }
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        onClose={() => {
          setCancelConfirmOpen(false);
          setRejectReason('');
        }}
        onConfirm={handleCancel}
        title="Reject this order?"
        message="Tell us why you are rejecting. This cannot be undone."
        confirmLabel="Yes, reject order"
        cancelLabel="Keep order"
        busyLabel="Rejecting..."
        busy={cancelBusy}
        requireReason
        reasonLabel="Rejection reason"
        reasonPlaceholder="Enter your reason..."
        reason={rejectReason}
        onReasonChange={setRejectReason}
      />
    </div>
  );
}
