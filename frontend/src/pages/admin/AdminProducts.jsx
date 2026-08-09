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
  specMode: 'none',
  specMarkdown: '',
  specImage: '',
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
    name: 'AISI316 Stainless Steel Bow Roller MK4242',
    price: 4500,
    categoryId: '',
    salePrice: 4200,
    shortDescription: 'AISI316 stainless steel bow roller',
    description: 'AISI316 stainless steel bow / anchor roller for marine deck use. Product Id MK4242.',
    specifications:
      '**Product Id:** MK4242\n\n**Material:** AISI 316 Stainless Steel\n\n**Finish:** Polished marine grade\n\n- Bow / anchor roller\n- Deck mount',
    specificationImage: '',
    maxOrderQty: 3,
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
  },
  {
    name: 'Mechanical Steering Kit 22 ft',
    price: 9600,
    categoryId: '',
    salePrice: '',
    shortDescription: 'Mechanical Steering Kit 22 ft',
    description: 'Mechanical steering kit for outboard applications, 22 ft cable.',
    specifications:
      '**Product Id:** MKMS-22\n\n**Cable Length:** 22 ft\n\n- Outboard compatible\n- Marine grade',
    specificationImage: '',
    maxOrderQty: 2,
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
  },
];

function specsFromProduct(product) {
  const raw = product?.specifications;
  if (!raw) return { mode: 'none', markdown: '', image: '' };
  if (Array.isArray(raw)) {
    const rows = raw
      .map((s) => ({
        key: String(s?.key || '').trim(),
        value: String(s?.value ?? '').trim(),
      }))
      .filter((s) => s.key);
    if (!rows.length) return { mode: 'none', markdown: '', image: '' };
    return {
      mode: 'markdown',
      markdown: rows.map((s) => `**${s.key}:** ${s.value}`).join('\n\n'),
      image: '',
    };
  }
  const mode = ['markdown', 'image', 'none'].includes(raw.mode) ? raw.mode : 'none';
  const markdown = String(raw.markdown || '').trim();
  const image = String(raw.image || '').trim();
  if (mode === 'image' && image) return { mode: 'image', markdown: '', image };
  if (mode === 'markdown' && markdown) return { mode: 'markdown', markdown, image: '' };
  if (image) return { mode: 'image', markdown: '', image };
  if (markdown) return { mode: 'markdown', markdown, image: '' };
  return { mode: 'none', markdown: '', image: '' };
}

function buildSpecsPayload(form) {
  if (form.specMode === 'image' && form.specImage?.trim()) {
    return { mode: 'image', markdown: '', image: form.specImage.trim() };
  }
  if (form.specMode === 'markdown' && form.specMarkdown?.trim()) {
    return { mode: 'markdown', markdown: form.specMarkdown.trim(), image: '' };
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
      name: product.name || '',
      category: product.category?._id || product.category || '',
      subcategory: product.subcategory?._id || product.subcategory || '',
      price: product.price ?? '',
      salePrice: product.salePrice ?? '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      specMode: specs.mode === 'none' ? 'markdown' : specs.mode,
      specMarkdown: specs.markdown,
      specImage: specs.image,
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
        specifications: buildSpecsPayload(form),
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
          specifications: (() => {
            const image = String(
              row.specificationimage ||
                row.specimage ||
                row.specification_image ||
                row.specificationImage ||
                ''
            ).trim();
            if (image) return { mode: 'image', markdown: '', image };
            const text = String(row.specifications || row.specification || row.specs || '').trim();
            if (!text) return { mode: 'none', markdown: '', image: '' };
            return { mode: 'markdown', markdown: text, image: '' };
          })(),
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
            <div className="mb-2">
              <label className="block text-sm font-medium">Product Specifications</label>
              <p className="text-xs text-gray-400">
                Optional — choose either a Markdown paragraph/table text, or one specification image.
              </p>
            </div>
            <div className="mb-3 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {[
                { id: 'markdown', label: 'Markdown text' },
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
            {form.specMode === 'markdown' ? (
              <div>
                <textarea
                  rows={8}
                  className="input-mk rounded-lg font-mono text-sm"
                  value={form.specMarkdown}
                  onChange={(e) => setForm({ ...form, specMarkdown: e.target.value })}
                  placeholder={
                    'Supports Markdown, for example:\n\n**Part Number:** MK-L1042\n\n- Length: 600mm\n- Width: 344mm\n\n| Spec | Value |\n| --- | --- |\n| Material | SS 316 |'
                  }
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Use headings, lists, bold, tables — shown as formatted text on the product page.
                </p>
              </div>
            ) : null}
            {form.specMode === 'image' ? (
              <ImageUpload
                section="products"
                label="Specification image"
                value={form.specImage}
                onChange={(url) => setForm({ ...form, specImage: url || '' })}
                hint="Upload a chart / datasheet image (max 1MB). Shown on the product page."
                previewClassName="h-36 w-full max-w-md"
              />
            ) : null}
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
          instructions="Upload Excel (.xlsx) or CSV. Row 1 = headers. Required: name, price, categoryId. Specifications: put Markdown text in the specifications column, OR an image URL in specificationImage (image wins if both). Leave specificationImage empty for markdown-only."
          exampleHeaders="name, price, categoryId, salePrice, shortDescription, description, specifications, specificationImage, maxOrderQty, isFeatured, isBestSeller, isNewArrival, isActive"
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
