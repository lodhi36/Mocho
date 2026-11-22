import { createSignal } from 'solid-js';

const [toasts, setToasts] = createSignal([]);
const [confirmState, setConfirmState] = createSignal(null);

let toastSeq = 0;

export function showToast(message, type = 'info', duration = 3600) {
  const id = ++toastSeq;
  setToasts((prev) => [...prev, { id, message, type }]);
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }
  return id;
}

export function dismissToast(id) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

export function requestConfirmation({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
}) {
  return new Promise((resolve) => {
    setConfirmState({
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone,
      resolve,
    });
  });
}

export function resolveConfirmation(accepted) {
  const current = confirmState();
  if (current && typeof current.resolve === 'function') {
    current.resolve(accepted);
  }
  setConfirmState(null);
}

export { toasts, confirmState };
