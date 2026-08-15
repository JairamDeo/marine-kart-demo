import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { FilterSelect } from '../../components/portal/FilterBar';
import ConfirmDialog from '../../components/portal/ConfirmDialog';
import { adminService } from '../../services/admin.service';
import { friendlyError } from '../../utils/toastMsg';

const PAGE_SIZE = 10;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusPill({ status }) {
  const s = status || 'pending';
  const styles =
    s === 'approved'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : s === 'rejected'
        ? 'bg-red-50 text-red-700 ring-red-200'
        : 'bg-amber-50 text-amber-800 ring-amber-200';
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${styles}`}
    >
      {label}
    </span>
  );
}

export default function AdminApprovals() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [accountType, setAccountType] = useState('');
  const [range, setRange] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
        accountType: accountType || undefined,
        search: search || undefined,
      };
      if (range === 'custom') {
        params.range = 'custom';
        if (dateFrom) params.from = dateFrom;
        if (dateTo) params.to = dateTo;
      } else if (range) {
        params.range = range;
      }
      const res = await adminService.approvals(params);
      setUsers(res.data.data.users || []);
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
      setPendingCount(res.data.data.pendingCount ?? 0);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, accountType, range, dateFrom, dateTo, search]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setBusy(true);
    try {
      await adminService.approveUser(approveTarget._id);
      toast.success('Account approved. Customer notified by email.');
      setApproveTarget(null);
      load();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !users.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Approvals</h1>
        <p className="mt-1 text-sm text-gray-400">
          Review verified registrations. Approve accounts before they can sign in.
          {pendingCount > 0 ? (
            <span className="ml-2 font-semibold text-amber-700">{pendingCount} pending</span>
          ) : null}
        </p>
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
            placeholder="Search name, email, phone, company..."
            className="input-mk box-border h-10 rounded-xl py-2 pl-10 pr-3 text-sm"
          />
        </div>
        <FilterSelect
          ariaLabel="Approval status"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </FilterSelect>
        <FilterSelect
          ariaLabel="Account type"
          value={accountType}
          onChange={(e) => {
            setPage(1);
            setAccountType(e.target.value);
          }}
        >
          <option value="">All types</option>
          <option value="customer">Normal customer</option>
          <option value="corporate">Corporate</option>
        </FilterSelect>
        <FilterSelect
          ariaLabel="Date range"
          value={range}
          onChange={(e) => {
            setPage(1);
            setRange(e.target.value);
            if (e.target.value !== 'custom') {
              setDateFrom('');
              setDateTo('');
            }
          }}
        >
          <option value="">All dates</option>
          <option value="day">Today</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
          <option value="custom">Custom date</option>
        </FilterSelect>
        {range === 'custom' && (
          <>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setPage(1);
                setDateFrom(e.target.value);
              }}
              className="input-mk box-border h-10 w-auto rounded-xl py-2 text-sm"
              aria-label="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setPage(1);
                setDateTo(e.target.value);
              }}
              className="input-mk box-border h-10 w-auto rounded-xl py-2 text-sm"
              aria-label="To date"
            />
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setSearch(searchDraft.trim());
          }}
          className="h-10 rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          Apply
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Approved on</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">
                    No approval requests match your filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const role = u.role === 'dealer' ? 'corporate' : u.role;
                  const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—';
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                        {u.phone ? <p className="text-xs text-gray-400">{u.phone}</p> : null}
                        {u.companyName ? (
                          <p className="text-xs text-gray-500">{u.companyName}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">
                        {role === 'corporate' ? 'Corporate' : 'Customer'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDateTime(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={u.approvalStatus} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(u.approvedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {u.approvalStatus === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => setApproveTarget(u)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-navy/20 bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#143a6e]"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              Page {pagination.page} of {pagination.pages} · {pagination.total} records
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

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        onConfirm={confirmApprove}
        title="Approve this account?"
        message={
          approveTarget
            ? `Do you want to approve the account for ${
                `${approveTarget.firstName || ''} ${approveTarget.lastName || ''}`.trim() ||
                approveTarget.email
              }?`
            : ''
        }
        confirmLabel="Approve"
        cancelLabel="Cancel"
        busyLabel="Approving..."
        busy={busy}
        danger={false}
      />
    </div>
  );
}
