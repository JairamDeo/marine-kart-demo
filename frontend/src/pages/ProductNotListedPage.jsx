import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, PackageSearch, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DeliveryAddressSection from '../components/common/DeliveryAddressSection';
import { categoryService } from '../services/category.service';
import { otherProductService } from '../services/otherProduct.service';
import { authService } from '../services/auth.service';
import { addressesEqual, emptyAddress, formatAddressBlock } from '../utils/address';
import { friendlyError } from '../utils/toastMsg';

const emptyForm = {
  productName: '',
  category: '',
  subcategory: '',
  quantity: '1',
  description: '',
};

const MAX_IMAGES = 5;

export default function ProductNotListedPage() {
  const { isAuthenticated, requireLogin, user, applyUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [billing, setBilling] = useState(emptyAddress);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loginPrompted, setLoginPrompted] = useState(false);

  const savedAddresses = useMemo(() => user?.addresses || [], [user]);

  useEffect(() => {
    categoryService
      .list()
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

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
      previews.forEach((url) => URL.revokeObjectURL(url));
    },
    [previews]
  );

  const subcategories = useMemo(() => {
    const cat = categories.find((c) => String(c._id || c.id) === String(form.category));
    return cat?.children || [];
  }, [categories, form.category]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onPickImages = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const room = MAX_IMAGES - files.length;
    if (room <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    const next = picked.slice(0, room);
    setFiles((prev) => [...prev, ...next]);
    setPreviews((prev) => [...prev, ...next.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed);
      return copy;
    });
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

    if (!billing.fullName?.trim() || !billing.phone?.trim() || !billing.line1?.trim()) {
      toast.error('Please fill in your delivery address.');
      return;
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

      let images = [];
      let imagePublicIds = [];
      if (files.length) {
        const { data: uploadRes } = await otherProductService.uploadImages(files);
        const uploaded = uploadRes.data?.images || [];
        images = uploaded.map((img) => img.url).filter(Boolean);
        imagePublicIds = uploaded.map((img) => img.publicId).filter(Boolean);
      }

      const cat = categories.find((c) => String(c._id || c.id) === String(form.category));
      const sub = subcategories.find((s) => String(s._id || s.id) === String(form.subcategory));

      const { data } = await otherProductService.submit({
        productName: form.productName.trim(),
        category: form.category || null,
        categoryName: cat?.name || '',
        subcategory: form.subcategory || null,
        subcategoryName: sub?.name || '',
        description: form.description.trim(),
        quantity: Math.max(1, Number(form.quantity) || 1),
        deliveryAddress: billing,
        address: formatAddressBlock(billing),
        images,
        imagePublicIds,
      });

      toast.success(data.message || 'Enquiry submitted successfully.', { id: toastId });
      setForm(emptyForm);
      setBilling(emptyAddress);
      setFiles([]);
      setPreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
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
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan">
            Product not listed
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Product Not Listed
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
            Can&apos;t find a marine product on our website? Tell us what you need with a short
            description. Our team will source it and get back to you.
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
              <div className="mb-4">
                <h2 className="text-base font-bold text-navy">Submit product enquiry</h2>
              </div>

              <form onSubmit={onSubmit} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    Product name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    className="input-mk rounded-xl text-sm"
                    placeholder="Enter product name or part number"
                    value={form.productName}
                    onChange={set('productName')}
                  />
                </div>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-600">
                      Product category
                    </label>
                    <select
                      className="input-mk rounded-xl text-sm"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          category: e.target.value,
                          subcategory: '',
                        }))
                      }
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat._id || cat.id} value={cat._id || cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-gray-600">
                      Product sub category
                    </label>
                    <select
                      className="input-mk rounded-xl text-sm"
                      value={form.subcategory}
                      onChange={set('subcategory')}
                      disabled={!form.category}
                    >
                      <option value="">Select sub category</option>
                      {subcategories.map((sub) => (
                        <option key={sub._id || sub.id} value={sub._id || sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    className="input-mk rounded-xl text-sm"
                    value={form.quantity}
                    onChange={set('quantity')}
                  />
                </div>

                <DeliveryAddressSection
                  key={user?.id || user?._id || 'guest'}
                  user={user}
                  value={billing}
                  onChange={setBilling}
                  compact
                />

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    Product description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="input-mk resize-y rounded-xl text-sm"
                    placeholder="Describe the product, specifications, brand preference, or any related details"
                    value={form.description}
                    onChange={set('description')}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-600">
                    Product images <span className="text-gray-400">(optional, up to 5)</span>
                  </label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-[#fafbfd] px-4 py-5 text-sm text-gray-500 transition hover:border-cyan/40 hover:bg-[#f4f9fc]">
                    <ImagePlus size={18} className="text-navy" />
                    <span>Upload reference photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={onPickImages}
                      disabled={files.length >= MAX_IMAGES}
                    />
                  </label>
                  {previews.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {previews.map((src, idx) => (
                        <div
                          key={src}
                          className="relative aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
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
                            onClick={() => removeImage(idx)}
                            className="absolute right-1 top-1 rounded-full bg-black/55 p-0.5 text-white"
                            aria-label="Remove image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
