import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Search, X } from 'lucide-react';
import { productService } from '../../services/product.service';
import { productImageUrl } from '../../utils/productImage';
import { formatProductTitle } from '../../utils/productTitle';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useThrottledCallback } from '../../hooks/useThrottledCallback';

/**
 * Header product search with debounce + throttled suggestion fetches.
 */
export default function HeaderProductSearch() {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef(null);
  const abortRef = useRef(null);

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const debouncedQ = useDebouncedValue(q.trim(), 320);

  const fetchSuggestions = useCallback(async (query) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!query || query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await productService.list(
        {
          search: query,
          limit: 8,
          page: 1,
          sort: '-createdAt',
        },
        { signal: controller.signal }
      );
      if (controller.signal.aborted) return;
      setSuggestions(res.data.data.products || []);
      setOpen(true);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || controller.signal.aborted) {
        return;
      }
      setSuggestions([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const throttledFetch = useThrottledCallback(fetchSuggestions, 450, { trailing: true });

  useEffect(() => {
    throttledFetch(debouncedQ);
  }, [debouncedQ, throttledFetch]);

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const goToShop = (query = q) => {
    const params = new URLSearchParams();
    const term = String(query || '').trim();
    if (term) params.set('search', term);
    params.delete('page');
    setOpen(false);
    navigate(`/shop?${params.toString()}`);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (abortRef.current) abortRef.current.abort();
    goToShop();
  };

  const showPanel = open && (loading || suggestions.length > 0 || debouncedQ.length >= 2);

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[640px]">
      <form
        onSubmit={onSubmit}
        className="flex w-full overflow-hidden rounded-md bg-white shadow-sm"
        role="search"
      >
        <div className="relative min-w-0 flex-1">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (e.target.value.trim().length >= 2) setOpen(true);
            }}
            onFocus={() => {
              if (q.trim().length >= 2 || suggestions.length) setOpen(true);
            }}
            placeholder="Search product..."
            className="w-full px-3 py-2.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 sm:px-4 sm:py-3"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={showPanel}
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                setSuggestions([]);
                setOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="flex shrink-0 items-center justify-center gap-2 bg-[#78c6d4] px-3 text-sm font-semibold text-white transition hover:bg-[#5bb5c6] sm:px-5"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        >
          {loading && suggestions.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin text-cyan" />
              Searching…
            </div>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              No products found for “{debouncedQ}”
            </p>
          ) : (
            <ul className="max-h-[70vh] overflow-auto py-1">
              {suggestions.map((p) => (
                <li key={p.id || p._id} role="option">
                  <Link
                    to={`/product/${p.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[#f3f8fb]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                      <img
                        src={productImageUrl(p, 96)}
                        alt=""
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">
                        {formatProductTitle(p)}
                      </span>
                      <span className="block truncate text-[11px] text-gray-400">
                        {p.category?.name || p.shortDescription || 'Marine product'}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-navy">
                      Ask for price
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {debouncedQ.length >= 2 && (
            <button
              type="button"
              onClick={() => goToShop(debouncedQ)}
              className="flex w-full items-center justify-center gap-2 border-t border-gray-100 bg-[#f8fafc] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-navy transition hover:bg-[#eef6f9]"
            >
              <Search size={14} />
              View all results for “{debouncedQ}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
