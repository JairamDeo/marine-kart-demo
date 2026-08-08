import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

/**
 * Initialize AOS once per mount. Call refresh on route changes via dependency.
 */
export function useAos(deps = []) {
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      mirror: false,
      disable: false,
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      AOS.refreshHard();
    }, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function refreshAos() {
  AOS.refresh();
}
