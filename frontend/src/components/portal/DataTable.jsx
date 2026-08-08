import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { FilterSelect, SearchField } from './FilterBar';

const PAGE_SIZE = 10;

export default function DataTable({
  columns,
  data = [],
  searchKeys = [],
  searchPlaceholder = 'Search...',
  sortOptions = [],
  defaultSort = '',
  emptyState,
  toolbar,
  filters,
  onSearchChange,
  onSortChange,
}) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...data];

    if (search.trim() && searchKeys.length) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((key) => {
          const val = key.split('.').reduce((o, k) => o?.[k], row);
          return String(val ?? '')
            .toLowerCase()
            .includes(q);
        })
      );
    }

    if (sort) {
      const [field, dir] = sort.split(':');
      rows.sort((a, b) => {
        const av = field.split('.').reduce((o, k) => o?.[k], a);
        const bv = field.split('.').reduce((o, k) => o?.[k], b);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'number' && typeof bv === 'number') {
          return dir === 'desc' ? bv - av : av - bv;
        }
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return dir === 'desc' ? -cmp : cmp;
      });
    }

    return rows;
  }, [data, search, searchKeys, sort]);

  useEffect(() => {
    setPage(1);
  }, [search, sort, data.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const goPage = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  const pageNumbers = useMemo(() => {
    const nums = [];
    const maxVisible = 5;
    let startNum = Math.max(1, safePage - Math.floor(maxVisible / 2));
    let endNum = Math.min(totalPages, startNum + maxVisible - 1);
    startNum = Math.max(1, endNum - maxVisible + 1);
    for (let i = startNum; i <= endNum; i++) nums.push(i);
    return nums;
  }, [safePage, totalPages]);

  return (
    <div className="portal-fade-in space-y-4">
      {(toolbar || searchKeys.length || sortOptions.length || filters) && (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
          <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              {searchKeys.length > 0 && (
                <SearchField
                  value={search}
                  placeholder={searchPlaceholder}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    onSearchChange?.(e.target.value);
                  }}
                />
              )}
              {filters}
              {sortOptions.length > 0 && (
                <FilterSelect
                  ariaLabel="Sort"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    onSortChange?.(e.target.value);
                  }}
                  className="w-[132px]"
                >
                  <option value="">Sort by</option>
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </FilterSelect>
              )}
            </div>
            {toolbar ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div>
            ) : null}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {columns.map((col) => (
                  <th
                    key={col.key || col.header}
                    className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    {emptyState || (
                      <div className="text-gray-400">
                        <Icon icon="bx:data" className="mx-auto mb-2 h-10 w-10 opacity-40" />
                        <p className="text-base font-medium text-gray-500">No records found</p>
                        <p className="mt-1 text-sm">Try adjusting your search or filters.</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                pageRows.map((row, idx) => (
                  <tr
                    key={row._id || row.id || idx}
                    className="border-b border-gray-50 transition last:border-0 hover:bg-amber-50"
                  >
                    {columns.map((col) => (
                      <td key={col.key || col.header} className="px-4 py-3.5 align-middle text-gray-700">
                        {col.render ? col.render(row, start + idx) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{start + 1}</span>–
              <span className="font-medium text-gray-600">
                {Math.min(start + PAGE_SIZE, filtered.length)}
              </span>{' '}
              of <span className="font-medium text-gray-600">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goPage(safePage - 1)}
                disabled={safePage <= 1}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white disabled:opacity-40"
                aria-label="Previous page"
              >
                <Icon icon="bx:chevron-left" className="h-4 w-4" />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => goPage(n)}
                  className={`min-w-[2rem] rounded-lg px-2 py-1 text-sm font-medium transition ${
                    n === safePage
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => goPage(safePage + 1)}
                disabled={safePage >= totalPages}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white disabled:opacity-40"
                aria-label="Next page"
              >
                <Icon icon="bx:chevron-right" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { PAGE_SIZE };
