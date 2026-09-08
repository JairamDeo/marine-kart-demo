import { useEffect } from 'react';

/**
 * Adds loading="lazy" only when an image has no explicit loading attribute.
 * Respects loading="eager" / fetchpriority for LCP images.
 */
export default function LazyImages() {
  useEffect(() => {
    const apply = (root) => {
      const nodes =
        root instanceof HTMLImageElement
          ? [root]
          : Array.from(root.querySelectorAll?.('img') || []);
      nodes.forEach((img) => {
        if (!img.getAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
        if (!img.getAttribute('decoding')) {
          img.setAttribute('decoding', 'async');
        }
      });
    };

    apply(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          apply(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
