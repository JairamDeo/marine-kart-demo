import { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { formatPrice } from '../../utils/format';

const PAGE_SIZES = [5, 10, 20, 50];

/**
 * Paginated order line-items table (admin + customer/corporate receipts).
 */
export default function OrderItemsTable({ items = [] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);

  const slice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-[#f8fafc] to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/10 text-navy">
            <Package size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900">Order items</p>
            <p className="text-[11px] text-gray-400">
              {total} product{total === 1 ? '' : 's'} in this order
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-navy outline-none"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-2.5 font-semibold">#</th>
              <th className="px-4 py-2.5 font-semibold">Product</th>
              <th className="px-4 py-2.5 font-semibold">SKU</th>
              <th className="px-4 py-2.5 font-semibold text-right">Qty</th>
              <th className="px-4 py-2.5 font-semibold text-right">Unit</th>
              <th className="px-4 py-2.5 font-semibold text-right">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {slice.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  No items on this order.
                </td>
              </tr>
            ) : (
              slice.map((item, idx) => {
                const rowNum = (safePage - 1) * pageSize + idx + 1;
                const line = item.totalPrice ?? (item.unitPrice || 0) * (item.quantity || 0);
                return (
                  <tr key={item.product?._id || item.product || rowNum} className="hover:bg-[#f8fafc]">
                    <td className="px-4 py-3 text-xs text-gray-400">{rowNum}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{item.name || '—'}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {item.sku || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatPrice(item.unitPrice || 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-navy">
                      {formatPrice(line)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-4 py-3">
        <p className="text-xs text-gray-500">
          Showing{' '}
          <span className="font-semibold text-gray-700">
            {from}–{to}
          </span>{' '}
          of <span className="font-semibold text-gray-700">{total}</span>
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-2 text-xs font-medium text-gray-500">
            Page {safePage} / {pages}
          </span>
          <button
            type="button"
            disabled={safePage >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-40"
          >
            Next
          </button>
          <form
            className="ml-1 flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const n = Math.min(pages, Math.max(1, Number(fd.get('goto')) || 1));
              setPage(n);
            }}
          >
            <input
              name="goto"
              type="number"
              min={1}
              max={pages}
              defaultValue={safePage}
              key={safePage}
              className="w-14 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-xs font-semibold outline-none focus:border-cyan"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-navy px-2.5 py-1.5 text-[10px] font-bold uppercase text-white"
            >
              Go
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
