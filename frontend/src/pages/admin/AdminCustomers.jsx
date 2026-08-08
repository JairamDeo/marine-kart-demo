import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { friendlyError } from '../../utils/toastMsg';
import DataTable from '../../components/portal/DataTable';
import Modal from '../../components/portal/Modal';
import { FilterSelect } from '../../components/portal/FilterBar';
import { adminService } from '../../services/admin.service';

function discountPercent(multiplier) {
  if (multiplier == null) return '0%';
  return `${Math.round((1 - multiplier) * 100)}%`;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ role: 'customer', priceMultiplier: 1, isActive: true });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.customers();
      setCustomers(res.data.data.customers || []);
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
      if (statusFilter === 'active' && c.isActive === false) return false;
      if (statusFilter === 'inactive' && c.isActive !== false) return false;
      return true;
    });
  }, [customers, roleFilter, statusFilter]);

  const openEdit = (customer) => {
    setEditTarget(customer);
    setForm({
      role: customer.role === 'dealer' ? 'corporate' : customer.role || 'customer',
      priceMultiplier: customer.priceMultiplier ?? 1,
      isActive: customer.isActive !== false,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setBusy(true);
    try {
      await adminService.updateCustomer(editTarget._id, form);
      toast.success('Customer updated successfully');
      setEditTarget(null);
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
      render: (row) => discountPercent(row.priceMultiplier),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => openEdit(row)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 transition hover:bg-sky-100"
          title="Edit"
        >
          <Icon icon="bx:edit-alt" width={18} height={18} />
        </button>
      ),
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
        <p className="mt-1 text-sm text-gray-400">Manage normal and corporate customers</p>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['firstName', 'lastName', 'email', 'phone', 'companyName']}
        searchPlaceholder="Search customers..."
        sortOptions={[
          { label: 'Name A–Z', value: 'firstName:asc' },
          { label: 'Email A–Z', value: 'email:asc' },
        ]}
        defaultSort="firstName:asc"
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
              className="w-[120px]"
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FilterSelect>
          </>
        }
      />

      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={`Edit ${editTarget?.firstName} ${editTarget?.lastName}`}
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
          <div>
            <label className="mb-1 block text-sm font-medium">
              Price Multiplier ({discountPercent(form.priceMultiplier)} off list)
            </label>
            <input
              type="number"
              min="0.1"
              max="1"
              step="0.01"
              className="input-mk rounded-lg"
              value={form.priceMultiplier}
              onChange={(e) => setForm({ ...form, priceMultiplier: Number(e.target.value) })}
            />
            <p className="mt-1 text-xs text-gray-500">
              1 = list price. For corporate, set e.g. 0.85 for custom rate. Activate pending
              corporate accounts with the checkbox below.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active account
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditTarget(null)} className="rounded-lg border px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-cyan rounded-lg px-4 py-2 text-sm">
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
