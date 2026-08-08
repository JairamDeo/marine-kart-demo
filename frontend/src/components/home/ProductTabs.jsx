import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [page, setPage] = useState(0);
  const perPage = 6;

  useEffect(() => {
    const tab = TABS.find((t) => t.key === active);
    setLoading(true);
    setError('');
    setPage(0);
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
  }, [loading, products, page]);

  const maxPage = Math.max(0, Math.ceil(products.length / perPage) - 1);
  const visible = products.slice(page * perPage, page * perPage + perPage);

  return (
    <section className="container-mk py-12" data-aos="fade-up">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan">Catalog</p>
        <h2 className="text-2xl font-bold uppercase tracking-wide text-navy md:text-3xl">
          Our Products
        </h2>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-cyan" />
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
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

      {!loading && products.length > perPage && (
        <div className="mb-5 flex justify-end gap-1">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-gray-200 bg-white p-2 text-navy transition hover:border-cyan hover:bg-cyan hover:text-white disabled:opacity-30"
            aria-label="Previous products"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            disabled={page >= maxPage}
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            className="rounded-lg border border-gray-200 bg-white p-2 text-navy transition hover:border-cyan hover:bg-cyan hover:text-white disabled:opacity-30"
            aria-label="Next products"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-200/70" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl bg-red-50 py-10 text-center text-red-600">
          Could not load products: {error}
          <br />
          <span className="text-sm text-gray-500">
            Check backend is running on port 5000, then refresh.
          </span>
        </p>
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No products found. Run backend seed.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {visible.map((p, i) => (
            <div key={p.id || p._id || p.sku} data-aos="fade-up" data-aos-delay={Math.min(i * 60, 300)}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
