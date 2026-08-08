import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import ProductListItem from '../components/product/ProductListItem';
import CatalogToolbar, {
  CatalogPagination,
  productGridClass,
} from '../components/product/CatalogToolbar';
import { categoryService } from '../services/category.service';
import { productService } from '../services/product.service';

const DEFAULT_LIMIT = 10;

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(null);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: DEFAULT_LIMIT });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem('mk_catalog_view') || 'grid');

  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const sort = searchParams.get('sort') || '-createdAt';
  const subcategoryId = searchParams.get('subcategory') || '';
  const limit = Math.max(1, Number(searchParams.get('limit') || DEFAULT_LIMIT));

  const setParam = useCallback(
    (key, value, resetPage = true) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value == null || value === '') next.delete(key);
        else next.set(key, String(value));
        if (resetPage && key !== 'page') next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    localStorage.setItem('mk_catalog_view', view);
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    categoryService
      .getBySlug(slug)
      .then(async (res) => {
        if (cancelled) return;
        const cat = res.data.data.category;
        const kids = res.data.data.children || [];
        setCategory(cat);
        setChildren(kids);

        const isChild = Boolean(cat.parent);
        const filter = {
          sort,
          page,
          limit,
        };

        if (isChild) {
          filter.subcategory = cat._id || cat.id;
        } else {
          filter.category = cat._id || cat.id;
          if (subcategoryId) filter.subcategory = subcategoryId;
        }

        const prodRes = await productService.list(filter);
        if (cancelled) return;
        setProducts(prodRes.data.data.products || []);
        setPagination(
          prodRes.data.data.pagination || {
            page,
            pages: 1,
            total: 0,
            limit,
          }
        );
      })
      .catch(() => {
        if (!cancelled) {
          setCategory(null);
          setProducts([]);
          setChildren([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, page, sort, subcategoryId, limit]);

  const title = useMemo(() => {
    if (!category) return '';
    if (subcategoryId && children.length) {
      const sub = children.find((c) => String(c._id || c.id) === String(subcategoryId));
      if (sub) return `${category.name} · ${sub.name}`;
    }
    return category.name;
  }, [category, children, subcategoryId]);

  if (loading && !category) {
    return (
      <div className="container-mk py-10">
        <div className="mb-6 h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-gray-200/70" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container-mk py-10">
        <p>Category not found.</p>
        <Link to="/shop" className="text-cyan">
          Back to shop
        </Link>
      </div>
    );
  }

  const isParent = !category.parent;
  const showSubFilter = isParent && children.length > 0;

  return (
    <div className="bg-gradient-to-b from-[#f4f8fb] to-white pb-14 pt-8">
      <div className="container-mk">
        <nav className="mb-4 text-xs text-gray-500">
          <Link to="/" className="hover:text-navy">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link to="/shop" className="hover:text-navy">
            Shop
          </Link>
          <span className="mx-1.5">/</span>
          <span className="font-medium text-navy">{title}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-navy md:text-3xl">
            {title}
          </h1>
          {category.description && (
            <p className="mt-2 max-w-3xl text-sm text-gray-500">{category.description}</p>
          )}
        </div>

        <CatalogToolbar
          view={view}
          onViewChange={setView}
          sort={sort}
          onSortChange={(v) => setParam('sort', v)}
          pagination={pagination}
          subcategories={showSubFilter ? children : []}
          subcategoryId={subcategoryId}
          onSubcategoryChange={(v) => setParam('subcategory', v)}
        />

        <div className="mt-5">
          {loading ? (
            <div className={productGridClass(view)}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`animate-pulse rounded-xl bg-gray-200/70 ${
                    view === 'list' ? 'h-36' : 'aspect-[3/4]'
                  }`}
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-gray-100">
              <p className="text-gray-500">No products in this category.</p>
              <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-cyan">
                Browse all products
              </Link>
            </div>
          ) : (
            <div className={productGridClass(view)}>
              {products.map((p) =>
                view === 'list' ? (
                  <ProductListItem key={p.id || p._id} product={p} />
                ) : (
                  <ProductCard key={p.id || p._id} product={p} />
                )
              )}
            </div>
          )}
        </div>

        <CatalogPagination
          pagination={pagination}
          pageSize={limit}
          onPageChange={(p) => setParam('page', p, false)}
          onPageSizeChange={(n) => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('limit', String(n));
              next.delete('page');
              return next;
            });
          }}
        />
      </div>
    </div>
  );
}
