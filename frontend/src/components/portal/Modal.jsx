import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  bare = false,
  noScroll = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    receipt: 'max-w-[380px]',
  };

  if (bare) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div
          className="portal-overlay absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
        <div
          className={`portal-modal-in relative z-10 w-full ${sizes[size] || sizes.md}`}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="portal-overlay absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`portal-modal-in relative z-10 flex w-full ${sizes[size] || sizes.md} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${
          noScroll ? 'max-h-[95vh]' : 'max-h-[90vh]'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-navy"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className={`px-6 py-5 ${
            noScroll ? 'overflow-visible' : 'max-h-[calc(90vh-4rem)] overflow-y-auto'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
