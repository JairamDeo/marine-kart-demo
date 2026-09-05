import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, PackageSearch, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DeliveryAddressSection from '../components/common/DeliveryAddressSection';
import { otherProductService } from '../services/otherProduct.service';
import { authService } from '../services/auth.service';
import { addressesEqual, emptyAddress, formatAddressBlock, validateDeliveryAddress } from '../utils/address';
import { friendlyError } from '../utils/toastMsg';

const MAX_PRODUCTS = 10;
const MAX_IMAGES_PER_PRODUCT = 3;

function emptyProduct() {
  return {
    productName: '',
    brand: '',
    modelSku: '',
    quantity: '1',
    specification: '',
    files: [],
    previews: [],
  };
}

export default function ProductNotListedPage() {
  const { isAuthenticated, requireLogin, user, applyUser } = useAuth();
  const [products, setProducts] = useState([emptyProduct()]);
  const [billing, setBilling] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const [loginPrompted, setLoginPrompted] = useState(false);

  const savedAddresses = useMemo(() => user?.addresses || [], [user]);

  useEffect(() => {
    if (!isAuthenticated && !loginPrompted) {
      setLoginPrompted(true);
      requireLogin(
        'Please login first to submit a product not listed enquiry.',
        '/login',
        '/product-not-listed'
      );
    }
  }, [isAuthenticated, loginPrompted, requireLogin]);

  useEffect(
    () => () => {
      products.forEach((p) => p.previews.forEach((url) => URL.revokeObjectURL(url)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const updateProduct = (idx, patch) => {
    setProducts((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const addProduct = () => {
    if (products.length >= MAX_PRODUCTS) {
      toast.error(`Maximum ${MAX_PRODUCTS} products per enquiry.`);
      return;
    }
    setProducts((prev) => [...prev, emptyProduct()]);
  };

  const removeProduct = (idx) => {
    setProducts((prev) => {
      const target = prev[idx];
      target?.previews?.forEach((url) => URL.revokeObjectURL(url));
      if (prev.length <= 1) return [emptyProduct()];
      return prev.filter((_, i) => i !== idx);
    });
  };

  const onPickImages = (idx, e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const current = products[idx];
    const room = MAX_IMAGES_PER_PRODUCT - (current?.files?.length || 0);
    if (room <= 0) {
      toast.error(`Maximum ${MAX_IMAGES_PER_PRODUCT} files per product.`);
      e.target.value = '';
      return;
    }
    const next = picked.slice(0, room);
    updateProduct(idx, {
      files: [...(current.files || []), ...next],
      previews: [...(current.previews || []), ...next.map((f) => URL.createObjectURL(f))],
    });
    e.target.value = '';
  };

  const removeImage = (productIdx, imageIdx) => {
    setProducts((prev) =>
      prev.map((row, i) => {
        if (i !== productIdx) return row;
        const files = row.files.filter((_, fi) => fi !== imageIdx);
        const previews = [...row.previews];
        const [removed] = previews.splice(imageIdx, 1);
        if (removed) URL.revokeObjectURL(removed);
        return { ...row, files, previews };
      })
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      requireLogin(
        'Please login first to submit a product not listed enquiry.',
        '/login',
        '/product-not-listed'
      );
      return;
    }

    const addressError = validateDeliveryAddress(billing);
    if (addressError) {
      toast.error(addressError);
      return;
    }

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.productName.trim()) {
        toast.error(`Product ${i + 1}: name / description is required.`);
        return;
      }
      if (!p.specification.trim()) {
        toast.error(`Product ${i + 1}: specification / grade / size is required.`);
        return;
      }
      if (!p.quantity || Number(p.quantity) < 1) {
        toast.error(`Product ${i + 1}: quantity is required.`);
        return;
      }
    }

    setBusy(true);
    const toastId = toast.loading('Submitting your enquiry...');
    try {
      const alreadySaved = savedAddresses.some((a) => addressesEqual(a, billing));
      if (!alreadySaved && billing.line1?.trim()) {
        const { data: addrRes } = await authService.addAddress({
          ...billing,
          label: savedAddresses.length ? 'Other' : 'Home',
          isDefault: savedAddresses.length === 0,
        });
        if (addrRes.data?.user) applyUser(addrRes.data.user);
      }

      const payloadProducts = [];
      for (const p of products) {
        let images = [];
        let imagePublicIds = [];
        if (p.files?.length) {
          const { data: uploadRes } = await otherProductService.uploadImages(p.files);
          const uploaded = uploadRes.data?.images || [];
          images = uploaded.map((img) => img.url).filter(Boolean);
          imagePublicIds = uploaded.map((img) => img.publicId).filter(Boolean);
        }
        payloadProducts.push({
          productName: p.productName.trim(),
          brand: p.brand.trim(),
          modelSku: p.modelSku.trim(),
          quantity: Math.max(1, Number(p.quantity) || 1),
          specification: p.specification.trim(),
          images,
          imagePublicIds,
        });
      }

      const { data } = await otherProductService.submit({
        products: payloadProducts,
        deliveryAddress: billing,
        address: formatAddressBlock(billing),
      });

      toast.success(data.message || 'Enquiry submitted successfully.', { id: toastId });
      products.forEach((p) => p.previews.forEach((url) => URL.revokeObjectURL(url)));
      setProducts([emptyProduct()]);
      setBilling(emptyAddress);
    } catch (err) {
      toast.error(friendlyError(err, 'Could not submit enquiry. Please try again.'), {
        id: toastId,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#eaf3f8] via-[#f7fafc] to-white">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#78c6d4]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-40 h-80 w-80 rounded-full bg-[#1a4b8c]/10 blur-3xl" />

      <div className="container-mk relative py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Request a Product
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Tell us what you need, even if it&apos;s not listed on our website.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          {!isAuthenticated ? (
            <div className="rounded-2xl border border-dashed border-[#1a4b8c]/25 bg-white/90 p-8 text-center shadow-sm">
              <PackageSearch className="mx-auto text-navy" size={36} />
              <p className="mt-4 text-base font-semibold text-navy">Login required</p>
              <p className="mt-2 text-sm text-gray-600">
                Please sign in to submit a product-not-listed enquiry.
              </p>
              <button
                type="button"
                onClick={() =>
                  requireLogin(
                    'Please login first to submit a product not listed enquiry.',
                    '/login',
                    '/product-not-listed'
                  )
                }
                className="mt-5 rounded-xl bg-[#1a4b8c] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143a6e]"
              >
                Login to continue
              </button>
            </div>
          ) : (
            <section className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-[0_20px_50px_-32px_rgba(26,75,140,0.35)] backdrop-blur sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-navy">Submit product enquiry</h2>
                <p className="text-[11px] text-gray-400">
                  {products.length} product{products.length === 1 ? '' : 's'}
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                {products.map((product, idx) => (
                  <div
                    key={`product-${idx}`}
                    className="rounded-2xl border border-gray-200/90 bg-[#fafbfd] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-navy">
                        Product {idx + 1}
                      </p>
                      {products.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProduct(idx)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          Product Name / Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          className="input-mk resize-y rounded-xl text-sm"
                          placeholder="Enter product name or short description"
                          value={product.productName}
                          onChange={(e) => updateProduct(idx, { productName: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-gray-600">
                            Brand / Manufacturer{' '}
                            <span className="font-normal text-gray-400">(if specific)</span>
                          </label>
                          <input
                            className="input-mk rounded-xl text-sm"
                            placeholder="Optional"
                            value={product.brand}
                            onChange={(e) => updateProduct(idx, { brand: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-gray-600">
                            Model / Part Number / SKU
                          </label>
                          <input
                            className="input-mk rounded-xl text-sm"
                            placeholder="Optional"
                            value={product.modelSku}
                            onChange={(e) => updateProduct(idx, { modelSku: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-gray-600">
                            Required Quantity <span className="text-rose-500">*</span>
                          </label>
                          <input
                            required
                            type="number"
                            min={1}
                            className="input-mk rounded-xl text-sm"
                            value={product.quantity}
                            onChange={(e) => updateProduct(idx, { quantity: e.target.value })}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="mb-1 block text-[11px] font-medium text-gray-600">
                            Required Specification / Grade / Size{' '}
                            <span className="text-rose-500">*</span>
                          </label>
                          <input
                            required
                            className="input-mk rounded-xl text-sm"
                            placeholder="e.g. SS 316, 1/2 inch"
                            value={product.specification}
                            onChange={(e) => updateProduct(idx, { specification: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-gray-600">
                          Product Image / Specification Sheet{' '}
                          <span className="font-normal text-gray-400">
                            — Upload (optional, up to {MAX_IMAGES_PER_PRODUCT})
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-4 text-sm text-gray-500 transition hover:border-cyan/40 hover:bg-[#f4f9fc]">
                          <ImagePlus size={18} className="text-navy" />
                          <span>Upload image or sheet</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => onPickImages(idx, e)}
                            disabled={(product.files?.length || 0) >= MAX_IMAGES_PER_PRODUCT}
                          />
                        </label>
                        {product.previews?.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-3">
                            {product.previews.map((src, imageIdx) => (
                              <div
                                key={src}
                                className="relative aspect-square overflow-hidden rounded-lg border border-gray-100 bg-white"
                              >
                                <img
                                  src={src}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(idx, imageIdx)}
                                  className="absolute right-1 top-1 rounded-full bg-black/55 p-0.5 text-white"
                                  aria-label="Remove file"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addProduct}
                  disabled={products.length >= MAX_PRODUCTS}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#1a4b8c]/35 bg-[#f3f8fb] px-4 py-3 text-sm font-semibold text-navy transition hover:border-[#1a4b8c]/60 hover:bg-[#e8f4f8] disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add another product
                </button>

                <DeliveryAddressSection
                  key={user?.id || user?._id || 'guest'}
                  user={user}
                  value={billing}
                  onChange={setBilling}
                  compact
                />

                <button
                  type="submit"
                  disabled={busy}
                  className="h-10 w-full rounded-xl bg-[#1a4b8c] text-sm font-semibold text-white transition hover:bg-[#143a6e] disabled:opacity-60 sm:w-auto sm:px-10"
                >
                  {busy ? 'Submitting...' : 'Submit enquiry'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
