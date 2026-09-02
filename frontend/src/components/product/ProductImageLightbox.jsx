import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * Medium image preview modal — left/right navigation + keyboard support.
 */
export default function ProductImageLightbox({
  open,
  images = [],
  index = 0,
  alt = 'Product image',
  onClose,
  onIndexChange,
}) {
  const total = images.length;
  const safeIndex = total ? ((index % total) + total) % total : 0;
  const src = total ? images[safeIndex] : '';

  const go = useCallback(
    (delta) => {
      if (total < 2) return;
      onIndexChange?.((safeIndex + delta + total) % total);
    },
    [onIndexChange, safeIndex, total]
  );

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, go, onClose]);

  if (!open || !src) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Close image preview"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
        className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
          <p className="text-xs font-semibold text-gray-500">
            {safeIndex + 1} / {total}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex min-h-[280px] items-center justify-center bg-gradient-to-br from-[#f0f6fa] via-[#eef3f7] to-[#e8eef3] p-4 sm:min-h-[360px]">
          {total > 1 && (
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-navy shadow-md transition hover:bg-gray-50 sm:left-3 sm:h-10 sm:w-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <img
            key={src}
            src={src}
            alt={`${alt} ${safeIndex + 1}`}
            className="max-h-[55vh] w-full max-w-full object-contain sm:max-h-[60vh]"
            loading="lazy"
            decoding="async"
          />

          {total > 1 && (
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-navy shadow-md transition hover:bg-gray-50 sm:right-3 sm:h-10 sm:w-10"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {total > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-gray-100 px-3 py-2.5">
            {images.map((thumb, i) => {
              const selected = i === safeIndex;
              return (
                <button
                  key={`lb-${thumb}-${i}`}
                  type="button"
                  onClick={() => onIndexChange?.(i)}
                  className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f3f7fa] p-0.5 transition ${
                    selected
                      ? 'border-2 border-cyan ring-1 ring-cyan/30'
                      : 'border border-gray-200 hover:border-cyan/50'
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={selected ? 'true' : undefined}
                >
                  <img
                    src={thumb}
                    alt=""
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
