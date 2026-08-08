import { useEffect, useState } from 'react';

/**
 * Generic async data hook for services.
 * usage: const { data, loading, error, refetch } = useFetch(() => productService.list())
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res?.data?.data ?? res?.data ?? res);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetcher();
        if (alive) setData(res?.data?.data ?? res?.data ?? res);
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: load };
}
