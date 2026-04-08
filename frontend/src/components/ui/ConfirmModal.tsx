import { clsx } from 'clsx';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'neutral';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'neutral',
  loading = false,
}: ConfirmModalProps) {
  const confirmClass =
    variant === 'danger'
      ? 'btn-danger'
      : variant === 'primary'
      ? 'btn-primary'
      : 'btn-secondary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showCloseButton={true}>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={clsx('btn', confirmClass)}
          disabled={loading}
        >
          {loading ? '...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
