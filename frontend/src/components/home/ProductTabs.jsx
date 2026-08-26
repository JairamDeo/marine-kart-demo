import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';
import { productService } from '../../services/product.service';
import { refreshAos } from '../../hooks/useAos';

const TABS = [
  { key: 'bestSeller', label: 'Best Sellers', params: { bestSeller: 'true' } },
  { key: 'featured', label: 'Featured Products', params: { featured: 'true' } },
  { key: 'newArrival', label: 'New Arrivals', params: { newArrival: 'true' } },
];

const SLIDE_MS = 2800;
const TRANSITION_MS = 550;

function uniqueProducts(products) {
  const seen = new Set();
  const list = [];
  for (const p of products) {
    const id = String(p.id || p._id || p.productId || p.sku || '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    list.push(p);
  }
  return list;
}

/** Unique products once, then one clone at the end so the loop can wrap seamlessly. */
function buildLoopTrack(products) {
  const base = uniqueProducts(products).map((p) => ({
    ...p,
    _mkKey: String(p.id || p._id || p.productId || p.sku),
  }));
  if (!base.length) return { track: [], baseCount: 0 };

  const track = [
    ...base.map((p) => ({ ...p, _mkKey: `${p._mkKey}-a` })),
    ...base.map((p) => ({ ...p, _mkKey: `${p._mkKey}-b` })),
  ];

  return { track, baseCount: base.length };
}

function ProductCarousel({ products }) {
  const { track, baseCount } = useMemo(() => buildLoopTrack(products), [products]);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [stepPx, setStepPx] = useState(0);
  const itemRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    setIndex(0);
    setAnimate(false);
  }, [products]);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const measure = () => {
      const mr = parseFloat(getComputedStyle(el).marginRight) || 0;
      setStepPx(el.offsetWidth + mr);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [track]);

  useEffect(() => {
    if (paused || !stepPx || baseCount < 1) return;
    const id = window.setInterval(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [paused, stepPx, baseCount]);

  useEffect(() => {
    if (index !== baseCount) return;
    const id = window.setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [index, baseCount]);

  const goNext = () => {
    if (!baseCount) return;
    setAnimate(true);
    setIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (!baseCount) return;
    const i = indexRef.current;
    if (i <= 0) {
      setAnimate(false);
      setIndex(baseCount);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setAnimate(true);
          setIndex(baseCount - 1);
        });
      });
      return;
    }
    setAnimate(true);
    setIndex(i - 1);
  };

  return (
    <div
      className="group relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f9f9f9] to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#f9f9f9] to-transparent sm:w-16" />

      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous products"
        className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-navy shadow-md ring-1 ring-gray-200 transition hover:bg-navy hover:text-white sm:left-2 sm:h-10 sm:w-10 lg:left-3"
      >
        <ChevronLeft size={22} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next products"
        className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-navy shadow-md ring-1 ring-gray-200 transition hover:bg-navy hover:text-white sm:right-2 sm:h-10 sm:w-10 lg:right-3"
      >
        <ChevronRight size={22} strokeWidth={2.25} />
      </button>

      <div
        className="flex w-max flex-nowrap py-1"
        style={{
          transform: `translate3d(-${index * stepPx}px, 0, 0)`,
          transition: animate ? `transform ${TRANSITION_MS}ms ease-in-out` : 'none',
        }}
      >
        {track.map((p, i) => (
          <div
            key={p._mkKey}
            ref={i === 0 ? itemRef : undefined}
            className="mr-4 w-[160px] shrink-0 sm:w-[180px] lg:w-[200px]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

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
      .list({ ...tab.params, limit: 30 })
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

  return (
    <section className="py-8 sm:py-10 lg:py-7" data-aos="fade-up">
      <div className="container-mk mb-5 text-center lg:mb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan">Catalog</p>
        <h2 className="text-2xl font-bold uppercase tracking-wide text-navy md:text-3xl">
          Our Products
        </h2>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-cyan" />
      </div>

      <div className="container-mk mb-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:mb-4">
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
        <div className="container-mk grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6 lg:gap-3">
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
        <ProductCarousel products={products} />
      )}
    </section>
  );
}
