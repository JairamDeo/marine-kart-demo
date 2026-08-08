import { useCallback, useEffect, useRef } from 'react';

/**
 * Throttle a callback — runs at most once per `wait` ms.
 * Leading edge by default; trailing call optional.
 */
export function useThrottledCallback(callback, wait = 400, options = {}) {
  const { trailing = true } = options;
  const cbRef = useRef(callback);
  const lastRan = useRef(0);
  const trailingTimer = useRef(null);
  const lastArgs = useRef(null);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (trailingTimer.current) clearTimeout(trailingTimer.current);
    },
    []
  );

  return useCallback(
    (...args) => {
      const now = Date.now();
      const remaining = wait - (now - lastRan.current);
      lastArgs.current = args;

      if (remaining <= 0) {
        if (trailingTimer.current) {
          clearTimeout(trailingTimer.current);
          trailingTimer.current = null;
        }
        lastRan.current = now;
        cbRef.current(...args);
        return;
      }

      if (trailing && !trailingTimer.current) {
        trailingTimer.current = setTimeout(() => {
          lastRan.current = Date.now();
          trailingTimer.current = null;
          if (lastArgs.current) cbRef.current(...lastArgs.current);
        }, remaining);
      }
    },
    [wait, trailing]
  );
}
