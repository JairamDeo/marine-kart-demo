import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure? This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busyLabel = 'Please wait...',
  busy = false,
  danger = true,
}) {
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={title} size="sm">
      <p className="text-sm leading-relaxed text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
            danger ? 'bg-red-500 hover:bg-red-600' : 'bg-navy hover:bg-[#143a6e]'
          }`}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
