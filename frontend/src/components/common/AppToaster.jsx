import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';

const TOAST_DURATION = 6000;

/**
 * Compact horizontal toasts with a thin progress bar (~6s).
 * Click toast or X to dismiss.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: TOAST_DURATION,
        style: {
          borderRadius: '10px',
          fontSize: '13px',
          padding: 0,
          boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
          maxWidth: '360px',
          overflow: 'hidden',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#fff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#fff' },
        },
        loading: {
          duration: Infinity,
        },
      }}
    >
      {(t) => {
        const tone =
          t.type === 'success'
            ? 'success'
            : t.type === 'error'
              ? 'error'
              : t.type === 'loading'
                ? 'loading'
                : 'blank';
        const showProgress = t.type !== 'loading' && t.duration !== Infinity;

        return (
          <ToastBar toast={t} style={{ padding: 0, overflow: 'hidden', background: 'transparent', boxShadow: 'none' }}>
            {({ icon, message }) => (
              <div
                role="status"
                className={`mk-toast mk-toast-${tone}`}
                onClick={() => toast.dismiss(t.id)}
              >
                <div className="mk-toast-row">
                  <span className="mk-toast-icon">{icon}</span>
                  <div className="mk-toast-msg">{message}</div>
                  <button
                    type="button"
                    className="mk-toast-close"
                    aria-label="Close"
                    onClick={(e) => {
                      e.stopPropagation();
                      toast.dismiss(t.id);
                    }}
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
                {showProgress ? (
                  <div className="mk-toast-track">
                    <div
                      key={t.id}
                      className="mk-toast-progress"
                      style={{
                        animationDuration: `${typeof t.duration === 'number' ? t.duration : TOAST_DURATION}ms`,
                        animationPlayState: t.paused ? 'paused' : 'running',
                      }}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );
}
