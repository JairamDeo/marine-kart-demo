import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, Eye, Heart, Minus, Plus, ShoppingCart } from 'lucide-react';
import { productService } from '../services/product.service';
import { wishlistService } from '../services/wishlist.service';
import { useAuth } from '../context/AuthContext';
import { useCartUI } from '../context/CartUIContext';
import { productImageUrl } from '../utils/productImage';
import { friendlyError } from '../utils/toastMsg';
import ProductCard from '../components/product/ProductCard';
import ProductImageLightbox from '../components/product/ProductImageLightbox';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const {
    addToCart,
    isAuthenticated,
    requireLogin,
    wishlistIds,
    refreshWishlist,
  } = useAuth();
  const { openCart } = useCartUI();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveImg(0);
    setProduct(null);
    productService
      .getBySlug(slug)
      .then((res) => {
        if (cancelled) return;
        const p = res.data.data.product;
        setProduct(p);
        setRelated(p?.relatedProducts || []);
        setQty(1);
      })
      .catch(() => {
        if (!cancelled) {
          setProduct(null);
          setRelated([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const imgs = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const specImg =
      product.specifications?.mode === 'image' && product.specifications?.image
        ? String(product.specifications.image).trim()
        : '';
    // Optional spec image appears as an extra gallery thumbnail (does not replace main images)
    if (specImg && !imgs.includes(specImg)) {
      return imgs.length ? [...imgs, specImg] : [specImg];
    }
    if (imgs.length) return imgs;
    return [productImageUrl(product, 900)];
  }, [product]);

  const productId = product ? String(product.id || product._id) : '';
  const inWishlist = productId && wishlistIds.includes(productId);
  const outOfStock = product
    ? product.stockStatus === 'out_of_stock' || product.inStock === false
    : false;
  const clampQty = (n) => Math.max(1, Math.floor(Number(n) || 1));

  const handleAdd = async () => {
    if (outOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    setBusy(true);
    try {
      await addToCart(product, clampQty(qty));
      toast.success('Added to cart');
      openCart();
    } catch (err) {
      toast.error(friendlyError(err, 'Could not add to cart'));
    } finally {
      setBusy(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      requireLogin('Please login first to save items to your wishlist.', '/login');
      return;
    }
    setWishBusy(true);
    try {
      const { data } = await wishlistService.toggle(productId);
      await refreshWishlist();
      toast.success(data.message || (data.data?.added ? 'Added to wishlist' : 'Removed from wishlist'));
    } catch (err) {
      toast.error(friendlyError(err, 'Could not update wishlist'));
    } finally {
      setWishBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f4f8fb] pb-16 pt-8">
        <div className="container-mk">
          <div className="mb-6 h-4 w-48 animate-pulse rounded bg-gray-200" />
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="aspect-[4/3] max-h-[280px] animate-pulse rounded-2xl bg-gray-200" />
            </div>
            <div className="space-y-4 lg:col-span-7">
              <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-4/5 animate-pulse rounded bg-gray-200" />
              <div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
              <div className="h-12 animate-pulse rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-mk py-20 text-center">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-10 shadow-sm ring-1 ring-gray-100">
          <p className="text-lg font-bold text-navy">Product not found</p>
          <p className="mt-2 text-sm text-gray-500">
            This product may be unavailable or the link is incorrect.
          </p>
          <Link to="/shop" className="btn-cyan mt-6 inline-block rounded-xl px-6 py-3 text-sm">
            Browse shop
          </Link>
        </div>
      </div>
    );
  }

  const currentSrc = gallery[activeImg] || gallery[0];
  const category = product.category;
  const subcategory = product.subcategory;

  return (
    <div className="bg-gradient-to-b from-[#eaf4f8] via-[#f7fafc] to-white pb-20">
      <div className="container-mk pt-6 sm:pt-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-[11px] text-gray-500 sm:mb-6 sm:gap-1.5 sm:text-sm">
          <Link to="/" className="transition hover:text-navy">
            Home
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link to="/shop" className="transition hover:text-navy">
            Shop
          </Link>
          {category?.slug && (
            <>
              <ChevronRight size={14} className="text-gray-300" />
              <Link to={`/category/${category.slug}`} className="transition hover:text-navy">
                {category.name}
              </Link>
            </>
          )}
          {subcategory?.name && (
            <>
              <ChevronRight size={14} className="text-gray-300" />
              <span className="text-gray-600">{subcategory.name}</span>
            </>
          )}
          <ChevronRight size={14} className="text-gray-300" />
          <span className="line-clamp-1 font-medium text-navy">
            {product.productId || product.name}
          </span>
        </nav>

        <div className="grid items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Gallery — slightly narrower, shorter, equal height with buy box */}
          <div className="flex lg:col-span-5">
            <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-gray-100 sm:p-2.5">
              <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                {gallery.length > 0 && (
                  <div
                    className="flex shrink-0 gap-2 overflow-x-auto p-0.5 sm:w-[56px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden"
                    role="listbox"
                    aria-label="Product images"
                  >
                    {gallery.map((src, i) => {
                      const selected = activeImg === i;
                      return (
                        <div
                          key={`${src}-${i}`}
                          className={`group relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#f3f7fa] sm:h-[48px] sm:w-[48px] ${
                            selected
                              ? 'border-2 border-cyan'
                              : 'border border-gray-200/80'
                          }`}
                        >
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            aria-label={`Select image ${i + 1}`}
                            onClick={() => setActiveImg(i)}
                            className="absolute inset-0 p-0.5 transition hover:border-cyan/50"
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-full w-full object-contain"
                              loading="lazy"
                              decoding="async"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImg(i);
                              setPreviewOpen(true);
                            }}
                            className="absolute bottom-0.5 right-0.5 z-10 flex h-5 w-5 items-center justify-center rounded bg-navy/85 text-white shadow-sm transition hover:bg-navy"
                            aria-label={`Preview image ${i + 1}`}
                            title="Preview"
                          >
                            <Eye size={11} strokeWidth={2.5} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
                  <div className="relative flex min-h-[200px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#f0f6fa] via-[#eef3f7] to-[#e8eef3] sm:min-h-[220px] sm:max-h-[280px]">
                    <img
                      key={currentSrc}
                      src={currentSrc}
                      alt={product.name}
                      className="max-h-full w-full object-contain p-2 transition duration-300 ease-out sm:p-3"
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-navy shadow-md ring-1 ring-gray-100 transition hover:bg-navy hover:text-white"
                      aria-label="Preview image"
                      title="Preview"
                    >
                      <Eye size={15} />
                    </button>
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                      {product.isNewArrival && (
                        <span className="rounded-full bg-cyan px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                          New
                        </span>
                      )}
                      {product.isBestSeller && (
                        <span className="rounded-full bg-navy px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
                          Best seller
                        </span>
                      )}
                    </div>
                    {gallery.length > 1 && (
                      <div className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-600 shadow-sm ring-1 ring-gray-100">
                        {activeImg + 1} / {gallery.length}
                      </div>
                    )}
                  </div>
                  {gallery.length > 1 && (
                    <div className="mt-2 flex items-center justify-center gap-2 sm:hidden">
                      <button
                        type="button"
                        aria-label="Previous image"
                        onClick={() =>
                          setActiveImg((i) => (i - 1 + gallery.length) % gallery.length)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-navy shadow-sm"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        aria-label="Next image"
                        onClick={() => setActiveImg((i) => (i + 1) % gallery.length)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-navy shadow-sm"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buy box — equal height with gallery */}
          <div className="flex lg:col-span-7">
            <div className="relative flex h-full w-full flex-col justify-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-5">
              <p
                className={`absolute right-4 top-4 text-xs font-semibold sm:right-5 sm:top-5 sm:text-sm ${
                  outOfStock ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {outOfStock ? 'Out Of Stock' : 'Available In Stock'}
              </p>

              <p className="pr-28 text-[11px] font-medium uppercase tracking-wide text-cyan sm:text-xs">
                {category?.name || 'Marine Product'}
              </p>
              <h1 className="mt-1 pr-28 text-xl font-extrabold leading-snug tracking-tight text-navy sm:text-2xl">
                {subcategory?.name
                  ? `${subcategory.name} - ${product.productId || product.name}`
                  : product.productId || product.name}
              </h1>

              <div className="mt-3 rounded-xl bg-gradient-to-br from-[#f3f8fb] to-[#eaf3f7] px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Description
                </p>
                <div className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {product.description ||
                    product.shortDescription ||
                    'No detailed description available for this product yet.'}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <button
                      type="button"
                      disabled={qty <= 1}
                      onClick={() => setQty((q) => clampQty(q - 1))}
                      className="flex h-10 w-9 items-center justify-center text-navy transition hover:bg-gray-50 disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(clampQty(e.target.value))}
                      className="h-10 w-12 border-x border-gray-200 text-center text-sm font-bold outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQty((q) => clampQty(q + 1))}
                      className="flex h-10 w-9 items-center justify-center text-navy transition hover:bg-gray-50"
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={busy || outOfStock}
                    onClick={handleAdd}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1a4b8c] px-4 text-sm font-bold text-white transition hover:bg-[#143a6e] disabled:opacity-50"
                  >
                    <ShoppingCart size={16} />
                    {busy ? 'Sending...' : outOfStock ? 'Out of stock' : 'Ask For Price'}
                  </button>

                  <button
                    type="button"
                    disabled={wishBusy}
                    onClick={handleWishlist}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                      inWishlist
                        ? 'border-rose-200 bg-rose-50 text-rose-500'
                        : 'border-gray-200 bg-white text-gray-400 hover:border-rose-200 hover:text-rose-500'
                    }`}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan">
                  You may also like
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-navy">Related products</h2>
              </div>
              <Link to="/shop" className="text-sm font-semibold text-navy hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p.id || p._id || p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <ProductImageLightbox
        open={previewOpen}
        images={gallery}
        index={activeImg}
        alt={product.productId || product.name}
        onClose={() => setPreviewOpen(false)}
        onIndexChange={(next) => {
          if (typeof next === 'function') setActiveImg(next);
          else setActiveImg(next);
        }}
      />
    </div>
  );
}
