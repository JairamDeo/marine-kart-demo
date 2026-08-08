import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { friendlyError } from '../../utils/toastMsg';
import Modal from '../../components/portal/Modal';
import ConfirmDialog from '../../components/portal/ConfirmDialog';
import { FilterSelect } from '../../components/portal/FilterBar';
import ActionIcon, { ActionGroup } from '../../components/portal/ActionIcon';
import OrderReceipt, { OrderStatusPill } from '../../components/common/OrderReceipt';
import AdminOrderItemsTable from '../../components/admin/AdminOrderItemsTable';
import { adminService } from '../../services/admin.service';
import { formatPrice } from '../../utils/format';
import { getAllowedAdminStatuses, formatOrderStatus } from '../../utils/orderStatusShared';

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

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [viewOrder, setViewOrder] = useState(null);
  const [workflow, setWorkflow] = useState({ nextStatus: null, canCancel: false, allowedStatuses: [] });
  const [form, setForm] = useState({ orderStatus: '', paymentStatus: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.orders({
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        customerType: customerType || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        sort,
        search: search || undefined,
      });
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentFilter, customerType, dateFrom, dateTo, sort, search]);

  useEffect(() => {
    load();
  }, [load]);

  const applyOrderState = (full, apiWorkflow) => {
    const wf = apiWorkflow || getAllowedAdminStatuses(full.orderStatus);
    setViewOrder(full);
    setWorkflow(wf);
    setForm({
      orderStatus: wf.nextStatus || full.orderStatus,
      paymentStatus: full.paymentStatus,
      note: '',
    });
  };

  const openView = async (order) => {
    try {
      const { data } = await adminService.getOrder(order._id);
      applyOrderState(data.data.order, data.data.workflow);
    } catch (err) {
      toast.error(friendlyError(err));
      applyOrderState(order, null);
    }
  };

  const submitUpdate = async () => {
    if (!viewOrder) return;
    setBusy(true);
    try {
      const payload = {
        paymentStatus: form.paymentStatus,
        note: form.note,
      };
      if (form.orderStatus && form.orderStatus !== viewOrder.orderStatus) {
        payload.orderStatus = form.orderStatus;
      }
      const { data } = await adminService.updateOrder(viewOrder._id, payload);
      toast.success(
        form.orderStatus === 'cancelled' && form.orderStatus !== viewOrder.orderStatus
          ? 'Order cancelled'
          : 'Order updated'
      );
      setCancelConfirmOpen(false);
      applyOrderState(data.data.order, data.data.workflow);
      load();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!viewOrder) return;
    const isCancelling =
      form.orderStatus === 'cancelled' && form.orderStatus !== viewOrder.orderStatus;
    if (isCancelling) {
      setCancelConfirmOpen(true);
      return;
    }
    await submitUpdate();
  };

  if (loading && !orders.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-400">View receipts, update status, track payments</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-gray-400">
            <Icon icon="bx:search" width={18} height={18} />
          </span>
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                setSearch(searchDraft.trim());
              }
            }}
            placeholder="Search by order #, name, email, phone..."
            className="input-mk box-border h-10 rounded-xl py-2 pl-10 pr-3 text-sm"
          />
        </div>
        <FilterSelect
          ariaLabel="Order status"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="w-[130px]"
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
          className="w-[130px]"
        >
          <option value="">Payment</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          ariaLabel="Customer type"
          value={customerType}
          onChange={(e) => {
            setPage(1);
            setCustomerType(e.target.value);
          }}
          className="w-[150px]"
        >
          <option value="">All customers</option>
          <option value="customer">Normal</option>
          <option value="corporate">Corporate</option>
        </FilterSelect>
        <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 text-[12px] text-gray-500">
          <span className="shrink-0 font-medium">From</span>
          <input
            type="date"
            aria-label="From date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => {
              setPage(1);
              setDateFrom(e.target.value);
            }}
            className="h-full min-w-0 cursor-pointer border-0 bg-transparent text-[13px] font-medium text-gray-700 outline-none"
          />
        </label>
        <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 text-[12px] text-gray-500">
          <span className="shrink-0 font-medium">To</span>
          <input
            type="date"
            aria-label="To date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => {
              setPage(1);
              setDateTo(e.target.value);
            }}
            className="h-full min-w-0 cursor-pointer border-0 bg-transparent text-[13px] font-medium text-gray-700 outline-none"
          />
        </label>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setDateFrom('');
              setDateTo('');
            }}
            className="h-10 cursor-pointer rounded-xl border border-gray-200 px-3 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
          >
            Clear dates
          </button>
        )}
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
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setSearch(searchDraft.trim());
          }}
          className="h-10 cursor-pointer rounded-xl bg-gray-900 px-4 text-[13px] font-semibold text-white hover:bg-gray-800"
        >
          Apply
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                    <Icon icon="bx:package" className="mx-auto mb-2 opacity-40" width={40} />
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((row) => (
                  <tr
                    key={row._id}
                    className="border-b border-gray-50 transition hover:bg-[#f8fafc]"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-mono text-sm font-bold text-gray-900">{row.orderNumber}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-800">
                        {row.user
                          ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() ||
                            row.user.email
                          : '—'}
                      </p>
                      {row.user?.email ? (
                        <p className="text-[11px] text-gray-400">{row.user.email}</p>
                      ) : null}
                      {row.user?.role ? (
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          {row.user.role === 'dealer' || row.user.role === 'corporate'
                            ? 'Corporate'
                            : 'Normal'}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">
                      {formatPrice(row.total)}
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusPill status={row.orderStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <OrderStatusPill status={row.paymentStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionGroup>
                        <ActionIcon
                          variant="view"
                          title="View order"
                          onClick={() => openView(row)}
                        />
                      </ActionGroup>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              Page {pagination.page} of {pagination.pages} · {pagination.total} orders
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(viewOrder)}
        onClose={() => setViewOrder(null)}
        bare
        size="xl"
      >
        {viewOrder && (
          <div className="grid max-h-[92vh] gap-4 overflow-y-auto rounded-2xl bg-[#f5f6f8] p-4 shadow-2xl lg:grid-cols-5 lg:overflow-hidden lg:p-5">
            <div className="min-w-0 space-y-4 overflow-y-auto lg:col-span-3 lg:max-h-[88vh]">
              <OrderReceipt
                order={viewOrder}
                onClose={() => setViewOrder(null)}
                showItems={false}
                showCustomer
              />
              <AdminOrderItemsTable items={viewOrder.items || []} />
            </div>
            <form
              onSubmit={handleUpdate}
              className="flex flex-col space-y-3 overflow-y-auto rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-4 shadow-sm lg:col-span-2 lg:max-h-[88vh]"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Update order
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Pending → Quotation Sent → Confirmed → Shipped → Delivered. Cancel only before
                  shipped.
                </p>
              </div>

              <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-gray-100">
                <p className="text-[11px] text-gray-400">Current status</p>
                <p className="mt-0.5 text-sm font-bold text-gray-900">
                  {formatOrderStatus(viewOrder.orderStatus)}
                </p>
              </div>

              {viewOrder.orderStatus === 'delivered' || viewOrder.orderStatus === 'cancelled' ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This order is final — no further status changes.
                </p>
              ) : (
                <div>
                  <label className="mb-1 block cursor-pointer text-sm font-medium">Next action</label>
                  <select
                    className="input-mk cursor-pointer rounded-xl"
                    value={form.orderStatus}
                    onChange={(e) => setForm({ ...form, orderStatus: e.target.value })}
                  >
                    <option value={viewOrder.orderStatus}>
                      Keep · {formatOrderStatus(viewOrder.orderStatus)}
                    </option>
                    {workflow.nextStatus && (
                      <option value={workflow.nextStatus}>
                        Advance → {formatOrderStatus(workflow.nextStatus)}
                      </option>
                    )}
                    {workflow.canCancel && (
                      <option value="cancelled">Cancel order</option>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block cursor-pointer text-sm font-medium">Payment status</label>
                <select
                  className="input-mk cursor-pointer rounded-xl"
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Note</label>
                <textarea
                  rows={2}
                  className="input-mk rounded-xl"
                  placeholder="Optional note saved with status change"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={
                  busy ||
                  (form.orderStatus === viewOrder.orderStatus &&
                    form.paymentStatus === viewOrder.paymentStatus)
                }
                className="mt-auto w-full cursor-pointer rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={submitUpdate}
        title="Cancel this order?"
        message="This cannot be undone. The order will be marked Cancelled."
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        busyLabel="Cancelling..."
        busy={busy}
      />
    </div>
  );
}
