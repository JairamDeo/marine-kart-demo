import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, Heart, Minus, Plus, ShoppingCart } from 'lucide-react';
import { productService } from '../services/product.service';
import { wishlistService } from '../services/wishlist.service';
import { useAuth } from '../context/AuthContext';
import { useCartUI } from '../context/CartUIContext';
import { formatPrice } from '../utils/format';
import { productImageUrl } from '../utils/productImage';
import { friendlyError } from '../utils/toastMsg';
import { clampOrderQty, getMaxOrderQty } from '../utils/maxOrderQty';
import ProductCard from '../components/product/ProductCard';
import MarkdownContent from '../components/product/MarkdownContent';

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
    if (imgs.length) return imgs;
    return [productImageUrl(product, 900)];
  }, [product]);

  const productId = product ? String(product.id || product._id) : '';
  const inWishlist = productId && wishlistIds.includes(productId);
  const maxQty = getMaxOrderQty(product);
  const clampQty = (n) => clampOrderQty(n, product);

  const handleAdd = async () => {
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
            <div className="lg:col-span-7">
              <div className="aspect-[4/3] animate-pulse rounded-3xl bg-gray-200" />
            </div>
            <div className="space-y-4 lg:col-span-5">
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
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 sm:text-sm">
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
          <span className="line-clamp-1 font-medium text-navy">{product.name}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Gallery — compact thumbs + main preview */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-[0_20px_50px_-28px_rgba(26,75,140,0.45)] ring-1 ring-gray-100 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
                {/* Thumbnails — small strip (vertical on desktop) */}
                {gallery.length > 0 && (
                  <div
                    className="flex shrink-0 gap-2 overflow-x-auto pb-0.5 sm:w-[72px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden sm:pb-0"
                    role="listbox"
                    aria-label="Product images"
                  >
                    {gallery.map((src, i) => {
                      const selected = activeImg === i;
                      return (
                        <button
                          key={`${src}-${i}`}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          aria-label={`View image ${i + 1}`}
                          onClick={() => setActiveImg(i)}
                          className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f3f7fa] p-1 transition duration-200 sm:h-[64px] sm:w-[64px] ${
                            selected
                              ? 'ring-2 ring-cyan ring-offset-2 ring-offset-white shadow-md'
                              : 'ring-1 ring-gray-200/80 hover:ring-cyan/50'
                          }`}
                        >
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                          {selected && (
                            <span className="pointer-events-none absolute inset-0 rounded-[10px] bg-cyan/10" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Main image — selected thumbnail */}
                <div className="relative min-w-0 flex-1">
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0f6fa] via-[#eef3f7] to-[#e8eef3]">
                    <img
                      key={currentSrc}
                      src={currentSrc}
                      alt={product.name}
                      className="max-h-full w-full object-contain p-4 transition duration-300 ease-out sm:p-6"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      {product.isNewArrival && (
                        <span className="rounded-full bg-cyan px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                          New
                        </span>
                      )}
                      {product.isBestSeller && (
                        <span className="rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                          Best seller
                        </span>
                      )}
                    </div>
                    {gallery.length > 1 && (
                      <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-gray-600 shadow-sm ring-1 ring-gray-100 backdrop-blur">
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

          {/* Buy box */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-28px_rgba(26,75,140,0.35)] ring-1 ring-gray-100 sm:p-7">
              <div className="mb-3 flex flex-wrap gap-2">
                {category?.name && (
                  <Link
                    to={`/category/${category.slug}`}
                    className="rounded-full bg-[#e8f4f8] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy"
                  >
                    {category.name}
                  </Link>
                )}
                {subcategory?.name && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    {subcategory.name}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-navy sm:text-3xl">
                {product.name}
              </h1>

              {product.shortDescription ? (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{product.shortDescription}</p>
              ) : null}

              <div className="mt-6 rounded-2xl bg-gradient-to-br from-[#f3f8fb] to-[#eaf3f7] p-5">
                {product.priceVisible ? (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Price
                    </p>
                    <div className="mt-1 flex flex-wrap items-end gap-3">
                      <span className="text-3xl font-extrabold text-navy">
                        {formatPrice(product.displayPrice)}
                      </span>
                      {product.salePrice != null && (
                        <span className="pb-1 text-base text-gray-400 line-through">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-navy">Login to view price</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Prices are shown after you sign in as a customer.
                    </p>
                    <Link
                      to={`/login?redirect=/product/${product.slug}`}
                      className="btn-cyan mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm"
                    >
                      Login to View Price
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    disabled={qty <= 1}
                    onClick={() => setQty((q) => clampQty(q - 1))}
                    className="flex h-12 w-11 items-center justify-center text-navy transition hover:bg-gray-50 disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={maxQty ?? undefined}
                    value={qty}
                    onChange={(e) => setQty(clampQty(e.target.value))}
                    className="h-12 w-14 border-x border-gray-200 text-center text-sm font-bold outline-none"
                  />
                  <button
                    type="button"
                    disabled={maxQty != null && qty >= maxQty}
                    onClick={() => setQty((q) => clampQty(q + 1))}
                    className="flex h-12 w-11 items-center justify-center text-navy transition hover:bg-gray-50 disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleAdd}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a4b8c] px-5 text-sm font-bold text-white transition hover:bg-[#143a6e] disabled:opacity-50"
                >
                  <ShoppingCart size={18} />
                  {busy ? 'Adding...' : 'Add to Cart'}
                </button>

                <button
                  type="button"
                  disabled={wishBusy}
                  onClick={handleWishlist}
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border transition ${
                    inWishlist
                      ? 'border-rose-200 bg-rose-50 text-rose-500'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-rose-200 hover:text-rose-500'
                  }`}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
                </button>
              </div>
              {maxQty != null && (
                <p className="mt-2 text-xs text-gray-500">Max {maxQty} per order</p>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-10 space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
            <h2 className="text-lg font-extrabold text-navy">Product description</h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">
              {product.description ||
                product.shortDescription ||
                'No detailed description available for this product yet.'}
            </div>
          </section>

          {product.specifications?.mode === 'markdown' && product.specifications?.markdown ? (
            <section className="overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-7">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">
                    Details
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight text-navy sm:text-2xl">
                    Product Specifications
                  </h2>
                </div>
              </div>
              <MarkdownContent content={product.specifications.markdown} />
            </section>
          ) : null}

          {product.specifications?.mode === 'image' && product.specifications?.image ? (
            <section className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan">
                  Details
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-navy sm:text-2xl">
                  Product Specifications
                </h2>
              </div>
              <div className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/50 to-white p-3 sm:p-4">
                <img
                  src={product.specifications.image}
                  alt={`${product.name} specifications`}
                  className="mx-auto max-h-[640px] w-full rounded-xl object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </section>
          ) : null}
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
    </div>
  );
}
