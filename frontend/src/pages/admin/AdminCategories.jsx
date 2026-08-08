import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { friendlyError } from '../../utils/toastMsg';
import DataTable from '../../components/portal/DataTable';
import Modal from '../../components/portal/Modal';
import ConfirmDialog from '../../components/portal/ConfirmDialog';
import ImageUpload from '../../components/portal/ImageUpload';
import BulkUploadPanel from '../../components/portal/BulkUploadPanel';
import { FilterSelect } from '../../components/portal/FilterBar';
import ActionIcon, { ActionGroup } from '../../components/portal/ActionIcon';
import { adminService } from '../../services/admin.service';
import { categoryImageUrl } from '../../utils/productImage';

const emptyCategory = {
  name: '',
  sortOrder: 0,
  description: '',
  image: '',
  isActive: true,
  subcategories: [''],
};

const CATEGORY_SAMPLE_CSV_ROWS = [
  { name: 'SS FIITINGS 316', sortOrder: 1, isActive: true },
  { name: 'Steering Wheel', sortOrder: 2, isActive: true },
  { name: 'Electrical Accessories', sortOrder: 3, isActive: true },
];

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyCategory);
  const [bulkRows, setBulkRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.categories();
      setCategories(res.data.data.categories || []);
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
    return categories.filter((c) => {
      if (statusFilter === 'active' && c.isActive === false) return false;
      if (statusFilter === 'inactive' && c.isActive !== false) return false;
      return true;
    });
  }, [categories, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCategory);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      sortOrder: cat.sortOrder ?? 0,
      description: cat.description || '',
      image: cat.image || '',
      isActive: cat.isActive !== false,
      subcategories: [''],
    });
    setModalOpen(true);
  };

  const setSubAt = (index, value) => {
    setForm((prev) => {
      const next = [...prev.subcategories];
      next[index] = value;
      return { ...prev, subcategories: next };
    });
  };

  const addSubRow = () => {
    setForm((prev) => ({ ...prev, subcategories: [...prev.subcategories, ''] }));
  };

  const removeSubRow = (index) => {
    setForm((prev) => {
      const next = prev.subcategories.filter((_, i) => i !== index);
      return { ...prev, subcategories: next.length ? next : [''] };
    });
  };

  const onSubKeyDown = (e, index) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const value = form.subcategories[index]?.trim();
    if (!value) return;
    if (index === form.subcategories.length - 1) {
      addSubRow();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing) {
        await adminService.updateCategory(editing._id, {
          name: form.name,
          sortOrder: Number(form.sortOrder) || 0,
          description: form.description,
          image: form.image || '',
          isActive: form.isActive,
        });
        toast.success('Category updated successfully');
      } else {
        const subs = form.subcategories.map((s) => s.trim()).filter(Boolean);
        await adminService.createCategory({
          name: form.name,
          sortOrder: Number(form.sortOrder) || 0,
          description: form.description,
          image: form.image || '',
          isActive: form.isActive,
          subcategories: subs,
        });
        toast.success(
          subs.length
            ? `Category created with ${subs.length} subcategory(ies)`
            : 'Category created successfully'
        );
      }
      setModalOpen(false);
      load();
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
      toast.success('Category deleted successfully');
      setDeleteTarget(null);
      load();
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
    const toastId = toast.loading('Uploading categories...');
    try {
      const items = bulkRows.map((row) => ({
        name: row.name || row.categoryname,
        sortOrder: Number(row.sortorder) || 0,
        isActive: String(row.isactive).toLowerCase() !== 'false',
      }));
      const { data } = await adminService.bulkCategories(items);
      const { created, updated, errors } = data.data;
      toast.success(`Done: ${created} created, ${updated} updated`, { id: toastId });
      if (errors?.length) toast.error(`${errors.length} row(s) could not be saved`);
      setBulkOpen(false);
      setBulkRows([]);
      load();
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
      header: 'Category',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={categoryImageUrl(row, 80)}
            alt=""
            className="h-10 w-10 rounded-xl border border-gray-100 object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{row.name}</p>
            {row.code ? <p className="text-[11px] text-gray-400">{row.code}</p> : null}
          </div>
        </div>
      ),
    },
    {
      header: 'Subcategories',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.subcategoryCount ?? row.subcategories?.length ?? 0}</span>
      ),
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Categories</h1>
        <p className="mt-1 text-sm text-gray-400">Main categories. Add subcategories while creating, or manage them on the Subcategories page.</p>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchKeys={['name', 'code']}
        searchPlaceholder="Search categories..."
        sortOptions={[
          { label: 'Name A–Z', value: 'name:asc' },
          { label: 'Name Z–A', value: 'name:desc' },
          { label: 'Sort ↑', value: 'sortOrder:asc' },
        ]}
        defaultSort="sortOrder:asc"
        filters={
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
              Add Category
            </button>
          </>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Category Name *</label>
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
          <ImageUpload
            section="categories"
            label="Category Image"
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
          />

          {!editing && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium">Subcategories (optional)</label>
                <button
                  type="button"
                  onClick={addSubRow}
                  className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  <Icon icon="bx:plus" width={16} height={16} />
                  Add row
                </button>
              </div>
              <p className="mb-2 text-xs text-gray-400">
                Type a name and press Enter to add the next row. Use the bin to remove.
              </p>
              <div className="space-y-2">
                {form.subcategories.map((sub, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      className="input-mk rounded-xl"
                      placeholder={`Subcategory ${index + 1}`}
                      value={sub}
                      onChange={(e) => setSubAt(index, e.target.value)}
                      onKeyDown={(e) => onSubKeyDown(e, index)}
                    />
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => removeSubRow(index)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-rose-500 hover:bg-rose-50"
                    >
                      <Icon icon="bx:trash" width={18} height={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editing && editing.subcategories?.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <p className="mb-1 font-medium text-gray-800">
                {editing.subcategories.length} subcategory(ies)
              </p>
              <p className="text-xs text-gray-400">
                Manage them on the Subcategories page.
              </p>
            </div>
          )}

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
        title="Bulk Upload Categories"
        size="lg"
      >
        <BulkUploadPanel
          instructions="Upload an Excel (.xlsx) or CSV (.csv) file. Row 1 must be headers. Each row is one main category."
          exampleHeaders="name, sortOrder, isActive"
          sampleCsvRows={CATEGORY_SAMPLE_CSV_ROWS}
          sampleFileName="categories-sample.csv"
          onParsed={(rows) => {
            setBulkRows(rows);
            toast.success(`${rows.length} row(s) ready to upload`);
          }}
          busy={busy}
        />
        {bulkRows.length > 0 && (
          <p className="mt-3 text-sm text-emerald-600">{bulkRows.length} categories loaded from file</p>
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
            {busy ? 'Uploading...' : 'Import Categories'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={busy}
        message={`Delete category "${deleteTarget?.name}" and all its subcategories?`}
      />
    </div>
  );
}
