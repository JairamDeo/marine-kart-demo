import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/product/ProductCard';
import ProductListItem from '../components/product/ProductListItem';
import CatalogToolbar, {
  CatalogPagination,
  productGridClass,
} from '../components/product/CatalogToolbar';
import { categoryService } from '../services/category.service';
import { productService } from '../services/product.service';

const DEFAULT_LIMIT = 10;

export default function ShopPage() {
  const [params, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: DEFAULT_LIMIT });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem('mk_catalog_view') || 'grid');

  const page = Math.max(1, Number(params.get('page') || 1));
  const sort = params.get('sort') || '-createdAt';
  const categoryId = params.get('category') || '';
  const subcategoryId = params.get('subcategory') || '';
  const search = params.get('search') || '';
  const limit = Math.max(1, Number(params.get('limit') || DEFAULT_LIMIT));

  const activeCategory = categories.find((c) => String(c._id || c.id) === String(categoryId));
  const subcategories = activeCategory?.children || [];

  const setParam = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value == null || value === '') next.delete(key);
        else next.set(key, String(value));
        if (key !== 'page') next.delete('page');
        if (key === 'category') next.delete('subcategory');
        return next;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    localStorage.setItem('mk_catalog_view', view);
  }, [view]);

  useEffect(() => {
    categoryService
      .list()
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = {
      search: search || undefined,
      category: categoryId || undefined,
      subcategory: subcategoryId || undefined,
      featured: params.get('featured') || undefined,
      bestSeller: params.get('bestSeller') || undefined,
      newArrival: params.get('newArrival') || undefined,
      sort,
      page,
      limit,
    };
    productService
      .list(query)
      .then((res) => {
        setProducts(res.data.data.products || []);
        setPagination(
          res.data.data.pagination || { page: 1, pages: 1, total: 0, limit }
        );
      })
      .catch(() => {
        setProducts([]);
        setPagination({ page: 1, pages: 1, total: 0, limit });
      })
      .finally(() => setLoading(false));
  }, [params, page, sort, categoryId, subcategoryId, search, limit]);

  return (
    <div className="bg-gradient-to-b from-[#f4f8fb] to-white pb-14 pt-8">
      <div className="container-mk">
        <div className="mb-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan">Catalog</p>
          <h1 className="text-2xl font-extrabold uppercase text-navy md:text-3xl">
            Shop / Products
          </h1>
          {search ? (
            <p className="mt-1 text-sm text-gray-500">
              Results for “{search}”
              <button
                type="button"
                className="ml-2 text-cyan hover:underline"
                onClick={() => setParam('search', '')}
              >
                Clear
              </button>
            </p>
          ) : null}
        </div>

        <CatalogToolbar
          view={view}
          onViewChange={setView}
          sort={sort}
          onSortChange={(v) => setParam('sort', v)}
          pagination={pagination}
          categories={categories}
          categoryId={categoryId}
          onCategoryChange={(v) => setParam('category', v)}
          subcategories={subcategories}
          subcategoryId={subcategoryId}
          onSubcategoryChange={(v) => setParam('subcategory', v)}
        />

        <div className="mt-5">
          {loading ? (
            <div className={productGridClass(view)}>
              {Array.from({ length: 10 }).map((_, i) => (
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
              <p className="text-gray-500">No products match your filters.</p>
              <Link to="/shop" className="mt-3 inline-block text-sm font-semibold text-cyan">
                Reset filters
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
          onPageChange={(p) => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('page', String(p));
              return next;
            });
          }}
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
