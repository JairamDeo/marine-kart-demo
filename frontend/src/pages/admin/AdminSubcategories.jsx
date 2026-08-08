import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { friendlyError } from '../../utils/toastMsg';
import DataTable from '../../components/portal/DataTable';
import Modal from '../../components/portal/Modal';
import ConfirmDialog from '../../components/portal/ConfirmDialog';
import BulkUploadPanel from '../../components/portal/BulkUploadPanel';
import { FilterSelect } from '../../components/portal/FilterBar';
import ActionIcon, { ActionGroup } from '../../components/portal/ActionIcon';
import { adminService } from '../../services/admin.service';

const emptyForm = {
  name: '',
  categoryId: '',
  sortOrder: 0,
  description: '',
  isActive: true,
};

const SUBCATEGORY_SAMPLE_CSV_ROWS = [
  { name: 'Boat Cleat', category: 'SS FIITINGS 316', sortOrder: 1, isActive: true },
  { name: 'Pull Rings', category: 'SS FIITINGS 316', sortOrder: 2, isActive: true },
  { name: 'Steering Wheel Sports Model', category: 'Steering Wheel', sortOrder: 1, isActive: true },
];

export default function AdminSubcategories() {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortFilter, setSortFilter] = useState('sort_asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [bulkRows, setBulkRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await adminService.categories();
      setCategories(res.data.data.categories || []);
    } catch (err) {
      toast.error(friendlyError(err));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (sortFilter) params.sort = sortFilter;
      const res = await adminService.subcategories(params);
      setSubcategories(res.data.data.subcategories || []);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, sortFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: categoryFilter || '',
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      categoryId: row.parent?._id || row.parent || '',
      sortOrder: row.sortOrder ?? 0,
      description: row.description || '',
      isActive: row.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error('Please select a category');
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        await adminService.updateCategory(editing._id, {
          name: form.name,
          parent: form.categoryId,
          sortOrder: Number(form.sortOrder) || 0,
          description: form.description,
          isActive: form.isActive,
        });
        toast.success('Subcategory updated successfully');
      } else {
        await adminService.createSubcategory({
          name: form.name,
          categoryId: form.categoryId,
          sortOrder: Number(form.sortOrder) || 0,
          description: form.description,
          isActive: form.isActive,
        });
        toast.success('Subcategory created successfully');
      }
      setModalOpen(false);
      load();
      loadCategories();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminService.deleteCategory(deleteTarget._id);
      toast.success('Subcategory deleted successfully');
      setDeleteTarget(null);
      load();
      loadCategories();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleBulk = async () => {
    if (!bulkRows.length) {
      toast.error('Please choose an Excel or CSV file first.');
      return;
    }
    setBusy(true);
    const toastId = toast.loading('Uploading subcategories...');
    try {
      const items = bulkRows.map((row) => ({
        name: row.name || row.subcategoryname || row.subcategory,
        category: row.category || row.categoryname || row.categoryid || row.categoryId,
        sortOrder: Number(row.sortorder) || 0,
        description: row.description || '',
        isActive: String(row.isactive).toLowerCase() !== 'false',
      }));
      const { data } = await adminService.bulkSubcategories(items);
      const { created, updated, errors } = data.data;
      toast.success(`Done: ${created} created, ${updated} updated`, { id: toastId });
      if (errors?.length) toast.error(`${errors.length} row(s) could not be saved`);
      setBulkOpen(false);
      setBulkRows([]);
      load();
      loadCategories();
    } catch (err) {
      toast.error(friendlyError(err), { id: toastId });
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
      header: 'Subcategory',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.code ? <p className="text-[11px] text-gray-400">{row.code}</p> : null}
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => row.parent?.name || '—',
    },
    { header: 'Sort', key: 'sortOrder' },
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
        <ActionGroup>
          <ActionIcon variant="edit" title="Edit" onClick={() => openEdit(row)} />
          <ActionIcon variant="delete" title="Delete" onClick={() => setDeleteTarget(row)} />
        </ActionGroup>
      ),
    },
  ];

  if (loading && !subcategories.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Subcategories</h1>
        <p className="mt-1 text-sm text-gray-400">
          Filter by category, sort, and manage subcategory records.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={subcategories}
        searchKeys={['name', 'code']}
        searchPlaceholder="Search subcategories..."
        sortOptions={[
          { label: 'Name A–Z', value: 'name:asc' },
          { label: 'Name Z–A', value: 'name:desc' },
          { label: 'Sort ↑', value: 'sortOrder:asc' },
        ]}
        defaultSort="sortOrder:asc"
        filters={
          <>
            <FilterSelect
              ariaLabel="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-[180px]"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
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
            <FilterSelect
              ariaLabel="API sort"
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              className="w-[140px]"
            >
              <option value="sort_asc">Sort order</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </FilterSelect>
          </>
        }
        toolbar={
          <>
            <button
              type="button"
              onClick={() => {
                setBulkRows([]);
                setBulkOpen(true);
              }}
              className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <Icon icon="bx:upload" width={18} height={18} />
              Bulk Upload
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-3.5 text-[13px] font-semibold text-white hover:bg-gray-800"
            >
              <Icon icon="bx:plus" width={18} height={18} />
              Add Subcategory
            </button>
          </>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Subcategory' : 'Add Subcategory'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Category *</label>
            <select
              required
              className="input-mk rounded-xl"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Subcategory Name *</label>
            <input
              required
              className="input-mk rounded-xl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sort Order</label>
            <input
              type="number"
              className="input-mk rounded-xl"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              rows={2}
              className="input-mk rounded-xl"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              {busy ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={bulkOpen}
        onClose={() => {
          setBulkOpen(false);
          setBulkRows([]);
        }}
        title="Bulk Upload Subcategories"
        size="lg"
      >
        <BulkUploadPanel
          instructions="Upload an Excel (.xlsx) or CSV (.csv) file. Row 1 must be headers. Use an existing category name (or category id) in the category column."
          exampleHeaders="name, category, sortOrder, isActive"
          sampleCsvRows={SUBCATEGORY_SAMPLE_CSV_ROWS}
          sampleFileName="subcategories-sample.csv"
          onParsed={(rows) => {
            setBulkRows(rows);
            toast.success(`${rows.length} row(s) ready to upload`);
          }}
          busy={busy}
        />
        {bulkRows.length > 0 && (
          <p className="mt-3 text-sm text-emerald-600">{bulkRows.length} subcategories loaded from file</p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setBulkOpen(false);
              setBulkRows([]);
            }}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBulk}
            disabled={busy || !bulkRows.length}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Uploading...' : 'Import Subcategories'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={busy}
        message={`Delete subcategory "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
