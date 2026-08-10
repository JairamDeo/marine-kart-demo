import { useEffect, useState } from 'react';
import ProductCard from '../product/ProductCard';
import { productService } from '../../services/product.service';
import { refreshAos } from '../../hooks/useAos';

const TABS = [
  { key: 'bestSeller', label: 'Best Sellers', params: { bestSeller: 'true' } },
  { key: 'featured', label: 'Featured Products', params: { featured: 'true' } },
  { key: 'newArrival', label: 'New Arrivals', params: { newArrival: 'true' } },
];

export default function ProductTabs() {
  const [active, setActive] = useState('bestSeller');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const tab = TABS.find((t) => t.key === active);
    setLoading(true);
    setError('');
    productService
      .list({ ...tab.params, limit: 24 })
      .then((res) => setProducts(res.data.data.products || []))
      .catch((err) => {
        setProducts([]);
        setError(err.message || 'Failed to load products');
      })
      .finally(() => setLoading(false));
  }, [active]);

  useEffect(() => {
    if (!loading) refreshAos();
  }, [loading, products]);

  const loop = products.length > 0 ? [...products, ...products] : [];
  // Slow by default; override with VITE_MARQUEE_DURATION_SEC (full loop seconds)
  // or VITE_MARQUEE_SECONDS_PER_PRODUCT (seconds per card, default 4)
  const envDuration = Number(import.meta.env.VITE_MARQUEE_DURATION_SEC);
  const perProduct = Number(import.meta.env.VITE_MARQUEE_SECONDS_PER_PRODUCT) || 4;
  const durationSec = Number.isFinite(envDuration) && envDuration > 0
    ? envDuration
    : Math.max(60, products.length * perProduct);

  return (
    <section className="py-12" data-aos="fade-up">
      <div className="container-mk mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan">Catalog</p>
        <h2 className="text-2xl font-bold uppercase tracking-wide text-navy md:text-3xl">
          Our Products
        </h2>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-cyan" />
      </div>

      <div className="container-mk mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`tab-pill rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-wide ${
                isActive
                  ? 'tab-pill-active bg-navy text-white shadow-md shadow-navy/20 hover:text-white'
                  : 'bg-white text-gray-400 shadow-sm ring-1 ring-gray-100 hover:bg-cyan/10 hover:text-navy hover:ring-cyan/30'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="container-mk grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-200/70" />
          ))}
        </div>
      ) : error ? (
        <p className="container-mk rounded-xl bg-red-50 py-10 text-center text-red-600">
          Could not load products: {error}
        </p>
      ) : products.length === 0 ? (
        <p className="container-mk py-10 text-center text-gray-500">No products found.</p>
      ) : (
        <div className="mk-marquee group relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f9f9f9] to-transparent sm:w-16" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#f9f9f9] to-transparent sm:w-16" />
          <div
            className="mk-marquee-track flex w-max gap-4 py-1 pl-4 group-hover:[animation-play-state:paused]"
            style={{ animationDuration: `${durationSec}s` }}
          >
            {loop.map((p, i) => (
              <div
                key={`${p.id || p._id || p.sku}-${i}`}
                className="w-[160px] shrink-0 sm:w-[180px] lg:w-[200px]"
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
