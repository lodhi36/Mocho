import { For, Show } from 'solid-js';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-solid';
import { Button } from './Button.jsx';
import { confirmState, dismissToast, resolveConfirmation, toasts } from '../../stores/toastStore.js';

export function Modal(props) {
  const maxWidth = () => props.maxWidth || 'max-w-xl';

  return (
    <Show when={props.open}>
      <div
        class="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1B3E]/45 backdrop-blur-[3px]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget && props.onClose) props.onClose();
        }}
      >
        <div
          class={`modal-panel-enter w-full ${maxWidth()} max-h-[90vh] flex flex-col bg-white border border-[#DDE6F2] rounded-2xl shadow-2xl overflow-hidden`}
        >
          <div class="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#DDE6F2]">
            <h3 class="text-base font-bold text-[#0D1B3E]">{props.title}</h3>
            <button
              type="button"
              onClick={() => props.onClose && props.onClose()}
              aria-label="Close modal"
              class="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#4B5C78] hover:bg-[#EBF1FA] hover:text-[#0D1B3E] active:scale-90 transition-transform cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 overflow-y-auto flex-1">{props.children}</div>
          <Show when={props.footer}>
            <div class="px-5 py-3.5 border-t border-[#DDE6F2] bg-[#F8FAFD] flex items-center justify-end gap-3">
              {props.footer}
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}

export function ConfirmDialog() {
  return (
    <Show when={confirmState()}>
      {(state) => (
        <div
          class="modal-backdrop-enter fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0D1B3E]/50 backdrop-blur-[3px]"
          role="alertdialog"
          aria-modal="true"
        >
          <div class="modal-panel-enter w-full max-w-md bg-white border border-[#DDE6F2] rounded-2xl shadow-2xl overflow-hidden">
            <div class="p-5">
              <h3 class="text-base font-bold text-[#0D1B3E]">{state().title}</h3>
              <p class="mt-2 text-sm text-[#4B5C78] leading-relaxed">{state().message}</p>
            </div>
            <div class="px-5 py-3.5 border-t border-[#DDE6F2] bg-[#F8FAFD] flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => resolveConfirmation(false)}>
                {state().cancelLabel}
              </Button>
              <Button
                variant={state().tone === 'danger' ? 'danger' : 'primary'}
                onClick={() => resolveConfirmation(true)}
              >
                {state().confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}

export function ToastContainer() {
  const toneClass = (type) => {
    if (type === 'success') return 'border-[#BBF7D0] bg-white text-[#0D1B3E]';
    if (type === 'error') return 'border-[#FECACA] bg-white text-[#0D1B3E]';
    if (type === 'warning') return 'border-[#FDE68A] bg-white text-[#0D1B3E]';
    return 'border-[#BFDBFE] bg-white text-[#0D1B3E]';
  };

  return (
    <div
      class="fixed top-4 right-4 z-[70] flex flex-col gap-2.5 w-[min(380px,calc(100vw-2rem))] pointer-events-none"
      aria-live="polite"
    >
      <For each={toasts()}>
        {(toast) => (
          <div
            class={`toast-slide-in pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-xl ${toneClass(
              toast.type
            )}`}
          >
            <div class="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 class="w-4 h-4 text-[#15803D]" />}
              {toast.type === 'error' && <AlertCircle class="w-4 h-4 text-[#B91C1C]" />}
              {toast.type === 'warning' && <AlertTriangle class="w-4 h-4 text-[#B45309]" />}
              {toast.type === 'info' && <Info class="w-4 h-4 text-[#1D4ED8]" />}
            </div>
            <p class="text-sm text-[#0D1B3E] flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              class="text-[#64748B] hover:text-[#0D1B3E] active:scale-90 transition-transform cursor-pointer p-0.5"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
