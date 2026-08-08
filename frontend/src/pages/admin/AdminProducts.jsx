import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import DataTable from '../../components/portal/DataTable';
import Modal from '../../components/portal/Modal';
import ConfirmDialog from '../../components/portal/ConfirmDialog';
import ProductImagesField from '../../components/portal/ProductImagesField';
import BulkUploadPanel from '../../components/portal/BulkUploadPanel';
import { FilterSelect } from '../../components/portal/FilterBar';
import ActionIcon, { ActionGroup } from '../../components/portal/ActionIcon';
import { adminService } from '../../services/admin.service';
import { formatPrice } from '../../utils/format';
import { friendlyError } from '../../utils/toastMsg';
import { productImageUrl } from '../../utils/productImage';

const emptyProduct = {
  name: '',
  category: '',
  subcategory: '',
  price: '',
  salePrice: '',
  shortDescription: '',
  description: '',
  specifications: [{ key: '', value: '' }],
  maxOrderQty: '',
  imageUrl: '',
  thumbnails: ['', '', '', ''],
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  isActive: true,
};

const PRODUCT_SAMPLE_CSV_ROWS = [
  {
    name: 'Sample Ladder Step',
    price: 2500,
    categoryId: '',
    salePrice: 2200,
    shortDescription: 'Marine grade ladder step',
    description: 'Stainless steel ladder step for marine use',
    specifications: 'Part Number:MK-L1042|Step:2|Length:600mm(23.5")|Width:344mm(13.5")|Centrum W:255mm(10")',
    maxOrderQty: 5,
    isActive: true,
  },
];

function normalizeSpecs(list) {
  return (Array.isArray(list) ? list : [])
    .map((s) => ({
      key: String(s?.key || '').trim(),
      value: String(s?.value ?? '').trim(),
    }))
    .filter((s) => s.key);
}

function parseBulkSpecs(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return normalizeSpecs(raw);
  const text = String(raw).trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return normalizeSpecs(parsed);
  } catch {
    /* pipe format */
  }
  return text
    .split('|')
    .map((pair) => {
      const idx = pair.indexOf(':');
      if (idx < 0) return null;
      return { key: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() };
    })
    .filter(Boolean)
    .filter((s) => s.key);
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [bulkRows, setBulkRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        adminService.products(),
        adminService.categories(),
      ]);
      setProducts(prodRes.data.data.products || []);
      setCategories(catRes.data.data.categories || []);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter && String(p.category?._id || p.category) !== categoryFilter) return false;
      if (statusFilter === 'active' && p.isActive === false) return false;
      if (statusFilter === 'inactive' && p.isActive !== false) return false;
      if (labelFilter === 'featured' && !p.isFeatured) return false;
      if (labelFilter === 'best' && !p.isBestSeller) return false;
      if (labelFilter === 'new' && !p.isNewArrival) return false;
      return true;
    });
  }, [products, categoryFilter, statusFilter, labelFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    const imgs = Array.isArray(product.images) ? product.images : [];
    const specs = normalizeSpecs(product.specifications);
    setForm({
      name: product.name || '',
      category: product.category?._id || product.category || '',
      subcategory: product.subcategory?._id || product.subcategory || '',
      price: product.price ?? '',
      salePrice: product.salePrice ?? '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      specifications: specs.length ? specs : [{ key: '', value: '' }],
      maxOrderQty:
        product.maxOrderQty != null && Number(product.maxOrderQty) > 0
          ? String(product.maxOrderQty)
          : '',
      imageUrl: imgs[0] || '',
      thumbnails: [imgs[1] || '', imgs[2] || '', imgs[3] || '', imgs[4] || ''],
      isFeatured: Boolean(product.isFeatured),
      isBestSeller: Boolean(product.isBestSeller),
      isNewArrival: Boolean(product.isNewArrival),
      isActive: product.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const gallery = [form.imageUrl, ...(form.thumbnails || [])].filter(Boolean);
      const payload = {
        name: form.name,
        category: form.category,
        subcategory: form.subcategory || null,
        price: Number(form.price),
        salePrice: form.salePrice !== '' ? Number(form.salePrice) : null,
        shortDescription: form.shortDescription,
        description: form.description,
        specifications: normalizeSpecs(form.specifications),
        maxOrderQty:
          form.maxOrderQty === '' || form.maxOrderQty == null
            ? 0
            : Math.max(0, Math.floor(Number(form.maxOrderQty) || 0)),
        images: gallery,
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isNewArrival: form.isNewArrival,
        isActive: form.isActive,
      };

      if (editing) {
        await adminService.updateProduct(editing._id, payload);
        toast.success('Product updated successfully');
      } else {
        await adminService.createProduct(payload);
        toast.success('Product created successfully');
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
      await adminService.deleteProduct(deleteTarget._id);
      toast.success('Product deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const parseBool = (v) => {
    if (typeof v === 'boolean') return v;
    const s = String(v ?? '').trim().toLowerCase();
    if (!s) return undefined;
    return s === 'true' || s === '1' || s === 'yes';
  };

  const handleBulk = async () => {
    if (!bulkRows.length) {
      toast.error('Please choose an Excel or CSV file first.');
      return;
    }
    setBusy(true);
    const toastId = toast.loading('Uploading products...');
    try {
      const items = bulkRows.map((row) => {
        const item = {
          name: row.name || row.productname,
          price: Number(row.price) || 0,
          category: row.categoryid || row.category || row.category_id,
          subcategory: row.subcategory || row.subcategoryid || row.subcategory_id || undefined,
          salePrice:
            row.saleprice !== undefined && row.saleprice !== ''
              ? Number(row.saleprice)
              : undefined,
          shortDescription: row.shortdescription || row.short_description || '',
          description: row.description || '',
          specifications: parseBulkSpecs(
            row.specifications || row.specification || row.specs || ''
          ),
        };
        const maxRaw = row.maxorderqty ?? row.max_order_qty ?? row.maxqty;
        if (maxRaw !== undefined && maxRaw !== '') {
          item.maxOrderQty = Math.max(0, Math.floor(Number(maxRaw) || 0));
        }
        const isFeatured = parseBool(row.isfeatured);
        const isBestSeller = parseBool(row.isbestseller);
        const isNewArrival = parseBool(row.isnewarrival);
        const isActive = parseBool(row.isactive);
        if (isFeatured !== undefined) item.isFeatured = isFeatured;
        if (isBestSeller !== undefined) item.isBestSeller = isBestSeller;
        if (isNewArrival !== undefined) item.isNewArrival = isNewArrival;
        if (isActive !== undefined) item.isActive = isActive;
        return item;
      });
      const { data } = await adminService.bulkProducts(items);
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

  const subcategories =
    categories.find((c) => String(c._id) === String(form.category))?.subcategories || [];

  const columns = [
    {
      header: 'Sr',
      render: (_row, idx) => <span className="text-xs text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'Product',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={productImageUrl(row, 80)}
            alt=""
            className="h-11 w-11 rounded-xl border border-gray-100 object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => row.category?.name || '—',
    },
    {
      header: 'Price',
      render: (row) => <span className="font-semibold text-gray-900">{formatPrice(row.price)}</span>,
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
      header: 'Labels',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.isBestSeller && (
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
              Best
            </span>
          )}
          {row.isFeatured && (
            <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
              Featured
            </span>
          )}
          {row.isNewArrival && (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              New
            </span>
          )}
          {!row.isBestSeller && !row.isFeatured && !row.isNewArrival && (
            <span className="text-gray-300">—</span>
          )}
        </div>
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your product catalog</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        searchKeys={['name']}
        searchPlaceholder="Search by name..."
        sortOptions={[
          { label: 'Name A–Z', value: 'name:asc' },
          { label: 'Name Z–A', value: 'name:desc' },
          { label: 'Price ↑', value: 'price:asc' },
          { label: 'Price ↓', value: 'price:desc' },
        ]}
        defaultSort="name:asc"
        filters={
          <>
            <FilterSelect
              ariaLabel="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-[150px]"
            >
              <option value="">Category</option>
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
              ariaLabel="Label"
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="w-[130px]"
            >
              <option value="">Label</option>
              <option value="featured">Featured</option>
              <option value="best">Best seller</option>
              <option value="new">New arrival</option>
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
              className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <Icon icon="bx:upload" width={18} height={18} />
              Bulk Upload
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-3.5 text-[13px] font-semibold text-white transition hover:bg-gray-800"
            >
              <Icon icon="bx:plus" width={18} height={18} />
              Add Product
            </button>
          </>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Product Name *</label>
              <input
                required
                className="input-mk rounded-lg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category *</label>
              <select
                required
                className="input-mk rounded-lg"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })}
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
              <label className="mb-1 block text-sm font-medium">Subcategory</label>
              <select
                className="input-mk rounded-lg"
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
              >
                <option value="">None</option>
                {subcategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Price *</label>
              <input
                required
                type="number"
                min="0"
                className="input-mk rounded-lg"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Sale Price</label>
              <input
                type="number"
                min="0"
                className="input-mk rounded-lg"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <ProductImagesField
                mainImage={form.imageUrl}
                thumbnails={form.thumbnails || ['', '', '', '']}
                onMainChange={(url) => setForm({ ...form, imageUrl: url })}
                onThumbnailsChange={(thumbs) => setForm({ ...form, thumbnails: thumbs })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Short Description</label>
            <textarea
              rows={2}
              className="input-mk rounded-lg"
              value={form.shortDescription}
              onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              placeholder="Brief summary shown on the product page"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              rows={3}
              className="input-mk rounded-lg"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <label className="block text-sm font-medium">Product Specifications</label>
                <p className="text-xs text-gray-400">
                  Optional. Shown as a table (e.g. Part Number, Step, Length, Width).
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    specifications: [...(form.specifications || []), { key: '', value: '' }],
                  })
                }
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Add row
              </button>
            </div>
            <div className="space-y-2">
              {(form.specifications || []).map((row, idx) => (
                <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    className="input-mk rounded-lg"
                    placeholder="Label (e.g. Part Number)"
                    value={row.key}
                    onChange={(e) => {
                      const next = [...form.specifications];
                      next[idx] = { ...next[idx], key: e.target.value };
                      setForm({ ...form, specifications: next });
                    }}
                  />
                  <input
                    className="input-mk rounded-lg"
                    placeholder='Value (e.g. MK-L1042)'
                    value={row.value}
                    onChange={(e) => {
                      const next = [...form.specifications];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setForm({ ...form, specifications: next });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = form.specifications.filter((_, i) => i !== idx);
                      setForm({
                        ...form,
                        specifications: next.length ? next : [{ key: '', value: '' }],
                      });
                    }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Max Qty Select Allow Per User
            </label>
            <input
              type="number"
              min="0"
              className="input-mk rounded-lg"
              value={form.maxOrderQty}
              onChange={(e) => setForm({ ...form, maxOrderQty: e.target.value })}
              placeholder="Leave empty for unlimited"
            />
            <p className="mt-1 text-xs text-gray-400">
              Customer/corporate can select up to this quantity per cart/order. After checkout they
              can order up to this amount again. 0 or empty = no limit.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              ['isFeatured', 'Featured'],
              ['isBestSeller', 'Best Seller'],
              ['isNewArrival', 'New Arrival'],
              ['isActive', 'Active'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  className="rounded border-gray-300 text-cyan focus:ring-cyan"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-cyan rounded-lg px-4 py-2 text-sm">
              {busy ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
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
        title="Bulk Upload Products"
        size="lg"
      >
        <BulkUploadPanel
          instructions="Upload an Excel (.xlsx) or CSV (.csv) file. Row 1 must be headers. Each following row is one product."
          exampleHeaders="name, price, categoryId, salePrice, shortDescription, description, specifications, maxOrderQty, isActive"
          sampleCsvRows={PRODUCT_SAMPLE_CSV_ROWS}
          sampleFileName="products-sample.csv"
          onParsed={(rows) => {
            setBulkRows(rows);
            toast.success(`${rows.length} row(s) ready to upload`);
          }}
          busy={busy}
        />
        {bulkRows.length > 0 && (
          <p className="mt-3 text-sm text-emerald-600">{bulkRows.length} products loaded from file</p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setBulkOpen(false);
              setBulkRows([]);
            }}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBulk}
            disabled={busy || !bulkRows.length}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Uploading...' : 'Import Products'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={busy}
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
