import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { friendlyError } from '../../utils/toastMsg';
import DataTable from '../../components/portal/DataTable';
import Modal from '../../components/portal/Modal';
import ConfirmDialog from '../../components/portal/ConfirmDialog';
import { FilterSelect } from '../../components/portal/FilterBar';
import ActionIcon, { ActionGroup } from '../../components/portal/ActionIcon';
import { adminService } from '../../services/admin.service';

function formatCorporateDiscount(row) {
  const type = row.corporateDiscountType;
  const value = Number(row.corporateDiscountValue) || 0;
  if (!type || value <= 0) return '—';
  if (type === 'cash') return `₹${value.toLocaleString('en-IN')} off`;
  return `${value}% off`;
}

function customerDisplayStatus(row) {
  if (row.approvalStatus === 'pending') return 'pending';
  if (row.isActive === false || row.approvalStatus === 'rejected') return 'inactive';
  return 'active';
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [form, setForm] = useState({
    role: 'customer',
    isActive: true,
    discountType: 'percent',
    discountValue: '',
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.customers();
      setCustomers(res.data.data.customers || []);
      setPendingCount(res.data.data.pendingCount ?? 0);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const role = c.role === 'dealer' ? 'corporate' : c.role;
      if (roleFilter && role !== roleFilter) return false;
      const status = customerDisplayStatus(c);
      if (statusFilter && status !== statusFilter) return false;
      return true;
    });
  }, [customers, roleFilter, statusFilter]);

  const openEdit = (customer) => {
    setEditTarget(customer);
    const role = customer.role === 'dealer' ? 'corporate' : customer.role || 'customer';
    setForm({
      role,
      isActive: customerDisplayStatus(customer) === 'active',
      discountType: customer.corporateDiscountType === 'cash' ? 'cash' : 'percent',
      discountValue:
        customer.corporateDiscountValue != null && Number(customer.corporateDiscountValue) > 0
          ? String(customer.corporateDiscountValue)
          : '',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setBusy(true);
    try {
      const payload = {
        role: form.role,
        isActive: form.isActive,
      };
      if (form.role === 'corporate') {
        payload.corporateDiscountType = form.discountType || 'percent';
        payload.corporateDiscountValue =
          form.discountValue === '' ? 0 : Math.max(0, Number(form.discountValue) || 0);
      } else {
        payload.corporateDiscountType = '';
        payload.corporateDiscountValue = 0;
      }
      const res = await adminService.updateCustomer(editTarget._id, payload);
      toast.success(res.data?.message || 'Customer updated successfully');
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    setBusy(true);
    try {
      await adminService.approveUser(approveTarget._id);
      toast.success('Account activated. Login details emailed to the customer.');
      setApproveTarget(null);
      load();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async (reason) => {
    if (!rejectTarget) return;
    setBusy(true);
    try {
      await adminService.rejectUser(rejectTarget._id, { reason });
      toast.success('Account rejected. Customer is now inactive.');
      setRejectTarget(null);
      load();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      header: 'Sr',
      render: (_r, idx) => <span className="text-xs text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
            {(row.firstName?.[0] || 'U').toUpperCase()}
          </div>
          <span className="font-medium text-gray-900">
            {`${row.firstName || ''} ${row.lastName || ''}`.trim() || '—'}
          </span>
        </div>
      ),
    },
    { header: 'Email', key: 'email' },
    { header: 'Phone', render: (row) => row.phone || '—' },
    {
      header: 'Account Type',
      render: (row) => {
        const role = row.role === 'dealer' ? 'corporate' : row.role;
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              role === 'corporate' ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {role === 'corporate' ? 'Corporate' : 'Customer'}
          </span>
        );
      },
    },
    {
      header: 'Company',
      render: (row) => row.companyName || '—',
    },
    {
      header: 'Discount',
      render: (row) => {
        const role = row.role === 'dealer' ? 'corporate' : row.role;
        if (role !== 'corporate') return <span className="text-gray-300">—</span>;
        return formatCorporateDiscount(row);
      },
    },
    {
      header: 'Status',
      render: (row) => {
        const status = customerDisplayStatus(row);
        const styles =
          status === 'pending'
            ? 'bg-amber-50 text-amber-800'
            : status === 'active'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-gray-100 text-gray-500';
        const label =
          status === 'pending' ? 'Pending' : status === 'active' ? 'Active' : 'Inactive';
        return (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
            {label}
          </span>
        );
      },
    },
    {
      header: 'Action',
      render: (row) => {
        const pending = row.approvalStatus === 'pending';
        if (pending) {
          return (
            <ActionGroup>
              <ActionIcon
                variant="default"
                icon="bx:check"
                title="Activate"
                className="!bg-emerald-50 !text-emerald-600 hover:!bg-emerald-100"
                onClick={() => setApproveTarget(row)}
              />
              <ActionIcon
                variant="delete"
                icon="bx:x"
                title="Reject"
                onClick={() => setRejectTarget(row)}
              />
            </ActionGroup>
          );
        }
        return (
          <ActionIcon variant="edit" title="Edit" onClick={() => openEdit(row)} />
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customers</h1>
        <p className="mt-1 text-sm text-gray-400">
          Email-verified customers only. Pending registrations need activate or reject.
          {pendingCount > 0 ? (
            <span className="ml-2 font-semibold text-amber-700">{pendingCount} pending</span>
          ) : null}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['firstName', 'lastName', 'email', 'phone', 'companyName']}
        searchPlaceholder="Search customers..."
        sortOptions={[
          { label: 'Newest', value: 'createdAt:desc' },
          { label: 'Name A–Z', value: 'firstName:asc' },
          { label: 'Email A–Z', value: 'email:asc' },
        ]}
        defaultSort="createdAt:desc"
        filters={
          <>
            <FilterSelect
              ariaLabel="Account type"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-[140px]"
            >
              <option value="">Type</option>
              <option value="customer">Customer</option>
              <option value="corporate">Corporate</option>
            </FilterSelect>
            <FilterSelect
              ariaLabel="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[130px]"
            >
              <option value="">Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FilterSelect>
          </>
        }
      />

      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={`Edit ${editTarget?.firstName || ''} ${editTarget?.lastName || ''}`.trim()}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Account Type</label>
            <select
              className="input-mk rounded-lg"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="customer">Customer</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          {form.role === 'corporate' ? (
            <div>
              <label className="mb-1 block text-sm font-medium">Discount off</label>
              <div className="mb-2 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, discountType: 'percent' })}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                    form.discountType === 'percent'
                      ? 'bg-white text-navy shadow'
                      : 'text-gray-500'
                  }`}
                >
                  Percent (%)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, discountType: 'cash' })}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                    form.discountType === 'cash' ? 'bg-white text-navy shadow' : 'text-gray-500'
                  }`}
                >
                  Cash (₹)
                </button>
              </div>
              <input
                type="number"
                min="0"
                step={form.discountType === 'percent' ? '1' : '0.01'}
                max={form.discountType === 'percent' ? '100' : undefined}
                className="input-mk rounded-lg"
                placeholder={form.discountType === 'percent' ? 'e.g. 15' : 'e.g. 500'}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              />
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active account
          </label>
          {customerDisplayStatus(editTarget || {}) === 'inactive' && form.isActive ? (
            <p className="rounded-lg bg-cyan/10 px-3 py-2 text-xs text-navy">
              Activating this account will email the customer a welcome message with new login
              credentials.
            </p>
          ) : null}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-cyan rounded-lg px-4 py-2 text-sm">
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onClose={() => setApproveTarget(null)}
        onConfirm={confirmApprove}
        title="Activate this account?"
        message={
          approveTarget
            ? `Activate ${
                `${approveTarget.firstName || ''} ${approveTarget.lastName || ''}`.trim() ||
                approveTarget.email
              }? They will receive a welcome email with login credentials.`
            : ''
        }
        confirmLabel="Activate"
        cancelLabel="Cancel"
        busyLabel="Activating..."
        busy={busy}
        danger={false}
      />

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={confirmReject}
        title="Reject this registration?"
        message={
          rejectTarget
            ? `Reject ${
                `${rejectTarget.firstName || ''} ${rejectTarget.lastName || ''}`.trim() ||
                rejectTarget.email
              }? The account will become inactive.`
            : ''
        }
        confirmLabel="Reject"
        cancelLabel="Cancel"
        busyLabel="Rejecting..."
        busy={busy}
        danger
        requireReason
        reasonLabel="Rejection reason"
        reasonPlaceholder="Why is this registration being rejected?"
      />
    </div>
  );
}
