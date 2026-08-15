import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import DataTable from '../../components/portal/DataTable';
import Modal from '../../components/portal/Modal';
import ConfirmDialog from '../../components/portal/ConfirmDialog';
import ProductImagesField from '../../components/portal/ProductImagesField';
import ImageUpload from '../../components/portal/ImageUpload';
import BulkUploadPanel from '../../components/portal/BulkUploadPanel';
import { FilterSelect } from '../../components/portal/FilterBar';
import ActionIcon, { ActionGroup } from '../../components/portal/ActionIcon';
import { adminService } from '../../services/admin.service';
import { friendlyError } from '../../utils/toastMsg';
import { productImageUrl } from '../../utils/productImage';
import { formatProductTitle } from '../../utils/productTitle';

const emptyProduct = {
  productId: '',
  category: '',
  subcategory: '',
  description: '',
  specMode: 'none',
  specImage: '',
  stockStatus: 'in_stock',
  imageUrl: '',
  thumbnails: ['', '', '', ''],
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  isActive: true,
};

const PRODUCT_SAMPLE_CSV_ROWS = [
  {
    productId: 'MK4242',
    categoryId: '',
    description: 'AISI316 STAINLESS STEEL BOW ROLLER',
    specificationImage: '',
    stockStatus: 'in_stock',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
  },
  {
    productId: 'MKMS-1.2-22',
    categoryId: '',
    description: 'Complete Package Mechanical Steering Kit 22 Feet',
    specificationImage: '',
    stockStatus: 'in_stock',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
  },
];

function specsFromProduct(product) {
  const raw = product?.specifications;
  if (!raw) return { mode: 'none', image: '' };
  if (Array.isArray(raw)) return { mode: 'none', image: '' };
  const image = String(raw.image || '').trim();
  if (image) return { mode: 'image', image };
  return { mode: 'none', image: '' };
}

function buildSpecsPayload(form) {
  if (form.specMode === 'image' && form.specImage?.trim()) {
    return { mode: 'image', markdown: '', image: form.specImage.trim() };
  }
  return { mode: 'none', markdown: '', image: '' };
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
    const specs = specsFromProduct(product);
    setForm({
      productId: product.productId || product.name || '',
      category: product.category?._id || product.category || '',
      subcategory: product.subcategory?._id || product.subcategory || '',
      description: product.description || '',
      specMode: specs.mode === 'image' ? 'image' : 'none',
      specImage: specs.image,
      stockStatus: product.stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock',
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
      const productId = String(form.productId || '').trim();
      const specifications = buildSpecsPayload(form);
      const payload = {
        productId,
        name: productId,
        category: form.category,
        subcategory: form.subcategory || null,
        shortDescription: '',
        description: form.description,
        specifications,
        stockStatus: form.stockStatus === 'out_of_stock' ? 'out_of_stock' : 'in_stock',
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
        const productId = String(
          row.productid || row.product_id || row.productId || row.name || row.productname || ''
        ).trim();
        const item = {
          productId,
          name: productId,
          category: row.categoryid || row.category || row.category_id,
          subcategory: row.subcategory || row.subcategoryid || row.subcategory_id || undefined,
          shortDescription: '',
          description: row.description || row.productdescription || row.product_description || '',
          specifications: (() => {
            const image = String(
              row.specificationimage ||
                row.specimage ||
                row.specification_image ||
                row.specificationImage ||
                row.specifications ||
                ''
            ).trim();
            // Only accept URLs/paths as image — ignore markdown text columns
            if (image && (image.startsWith('http') || image.startsWith('/') || /\.(png|jpe?g|webp|gif)$/i.test(image))) {
              return { mode: 'image', markdown: '', image };
            }
            return { mode: 'none', markdown: '', image: '' };
          })(),
          stockStatus: (() => {
            const s = String(row.stockstatus || row.stock || '').toLowerCase().trim();
            if (s === 'out_of_stock' || s === 'out of stock' || s === 'outofstock') {
              return 'out_of_stock';
            }
            return 'in_stock';
          })(),
        };
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
            <p className="truncate font-medium text-gray-900">{formatProductTitle(row)}</p>
            {row.description ? (
              <p className="truncate text-xs text-gray-400">{row.description}</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => row.category?.name || '—',
    },
    {
      header: 'Stock',
      render: (row) => {
        const out = row.stockStatus === 'out_of_stock';
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              out ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {out ? 'Out of stock' : 'In stock'}
          </span>
        );
      },
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
        searchKeys={['name', 'productId', 'description']}
        searchPlaceholder="Search by product id..."
        sortOptions={[
          { label: 'Product Id A–Z', value: 'name:asc' },
          { label: 'Product Id Z–A', value: 'name:desc' },
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
              <label className="mb-1 block text-sm font-medium">Product Id *</label>
              <input
                required
                className="input-mk rounded-lg"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                placeholder="e.g. MK4242"
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
              <label className="mb-1 block text-sm font-medium">Stock *</label>
              <select
                required
                className="input-mk rounded-lg"
                value={form.stockStatus}
                onChange={(e) => setForm({ ...form, stockStatus: e.target.value })}
              >
                <option value="in_stock">Available In Stock</option>
                <option value="out_of_stock">Out Of Stock</option>
              </select>
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
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              rows={3}
              className="input-mk rounded-lg"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Product Specifications</label>
            </div>
            <div className="mb-3 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {[
                { id: 'image', label: 'Image' },
                { id: 'none', label: 'None' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm({ ...form, specMode: opt.id })}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    form.specMode === opt.id
                      ? 'bg-[#1a4b8c] text-white'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.specMode === 'image' ? (
              <ImageUpload
                section="products"
                label="Specification image"
                value={form.specImage}
                onChange={(url) => setForm({ ...form, specImage: url || '' })}
                hint="Upload a chart / datasheet image (max 1MB)."
                previewClassName="h-36 w-full max-w-md"
              />
            ) : null}
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
          instructions="Upload Excel (.xlsx) or CSV. Row 1 = headers. Required: productId, categoryId. Optional: description, specificationImage, stockStatus, flags."
          exampleHeaders="productId, categoryId, description, specificationImage, stockStatus, isFeatured, isBestSeller, isNewArrival, isActive"
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
        message={`Delete "${deleteTarget?.productId || deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
