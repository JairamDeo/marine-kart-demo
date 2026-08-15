import { useEffect, useState } from 'react';
import { LayoutGrid, List, Grid2X2 } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Sort by newness' },
  { value: 'name', label: 'Name: A–Z' },
  { value: '-name', label: 'Name: Z–A' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const VIEWS = [
  { id: 'grid', label: 'Compact grid', icon: LayoutGrid },
  { id: 'zoom', label: 'Large cards', icon: Grid2X2 },
  { id: 'list', label: 'List view', icon: List },
];

/**
 * Single-row catalog toolbar: views + category + subcategory + sort + count.
 */
export default function CatalogToolbar({
  view,
  onViewChange,
  sort,
  onSortChange,
  pagination,
  categories = [],
  categoryId = '',
  onCategoryChange,
  subcategories = [],
  subcategoryId = '',
  onSubcategoryChange,
}) {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const total = pagination?.total || 0;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const selectClass =
    'max-w-[150px] cursor-pointer truncate rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-navy outline-none focus:border-cyan sm:max-w-[180px] sm:text-sm';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-[#f3f4f6] px-2.5 py-2 sm:gap-2.5 sm:px-3">
      <div className="flex shrink-0 items-center gap-0.5">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          const active = view === v.id;
          return (
            <button
              key={v.id}
              type="button"
              title={v.label}
              onClick={() => onViewChange?.(v.id)}
              className={`flex h-8 w-8 items-center justify-center rounded transition sm:h-9 sm:w-9 ${
                active
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:bg-white/70 hover:text-gray-700'
              }`}
            >
              <Icon size={17} strokeWidth={active ? 2.25 : 1.75} />
            </button>
          );
        })}
      </div>

      {categories.length > 0 && (
        <select
          value={categoryId}
          onChange={(e) => onCategoryChange?.(e.target.value)}
          title="Category"
          className={selectClass}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id || c.id} value={c._id || c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      {subcategories.length > 0 && (
        <select
          value={subcategoryId}
          onChange={(e) => onSubcategoryChange?.(e.target.value)}
          title="Subcategory"
          className={selectClass}
        >
          <option value="">All subcategories</option>
          {subcategories.map((s) => (
            <option key={s._id || s.id} value={s._id || s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={sort}
        onChange={(e) => onSortChange?.(e.target.value)}
        className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none sm:text-sm"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <p className="ml-auto whitespace-nowrap text-[11px] text-gray-500 sm:text-xs">
        Showing{' '}
        <span className="font-semibold text-gray-700">
          {from}–{to}
        </span>{' '}
        of <span className="font-semibold text-gray-700">{total}</span>
      </p>
    </div>
  );
}

export function CatalogPagination({ pagination, onPageChange, pageSize, onPageSizeChange }) {
  const page = pagination?.page || 1;
  const pages = Math.max(1, pagination?.pages || 1);
  const [gotoDraft, setGotoDraft] = useState(String(page));

  useEffect(() => {
    setGotoDraft(String(page));
  }, [page]);

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(pages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const nums = [];
  for (let i = start; i <= end; i += 1) nums.push(i);

  const jumpTo = () => {
    const n = Math.min(pages, Math.max(1, Number.parseInt(gotoDraft, 10) || 1));
    setGotoDraft(String(n));
    if (n !== page) onPageChange?.(n);
  };

  return (
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="whitespace-nowrap text-xs font-medium text-gray-500">Per page</span>
        <select
          value={pageSize || pagination?.limit || 10}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm font-semibold text-navy outline-none"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">records</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1 || pages <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-navy disabled:opacity-40"
        >
          Prev
        </button>
        {start > 1 && (
          <>
            <PageBtn n={1} active={page === 1} onClick={() => onPageChange(1)} />
            {start > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}
        {nums.map((n) => (
          <PageBtn key={n} n={n} active={page === n} onClick={() => onPageChange(n)} />
        ))}
        {end < pages && (
          <>
            {end < pages - 1 && <span className="px-1 text-gray-400">…</span>}
            <PageBtn n={pages} active={page === pages} onClick={() => onPageChange(pages)} />
          </>
        )}
        <button
          type="button"
          disabled={page >= pages || pages <= 1}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-navy disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          jumpTo();
        }}
      >
        <label htmlFor="mk-goto-page" className="whitespace-nowrap text-xs font-medium text-gray-500">
          Go to page
        </label>
        <input
          id="mk-goto-page"
          type="number"
          min={1}
          max={pages}
          value={gotoDraft}
          onChange={(e) => setGotoDraft(e.target.value)}
          className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-2 text-center text-sm font-semibold text-navy outline-none focus:border-cyan"
        />
        <span className="text-xs text-gray-400">/ {pages}</span>
        <button
          type="submit"
          className="rounded-lg bg-navy px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#143a6e]"
        >
          Go
        </button>
      </form>
    </div>
  );
}

function PageBtn({ n, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-9 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-navy text-white shadow'
          : 'border border-gray-200 bg-white text-gray-700 hover:border-cyan'
      }`}
    >
      {n}
    </button>
  );
}

export function productGridClass(view) {
  if (view === 'list') return 'flex flex-col gap-3';
  if (view === 'zoom') return 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
}

export { SORT_OPTIONS, PAGE_SIZE_OPTIONS };
