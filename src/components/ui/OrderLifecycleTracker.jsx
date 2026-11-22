import { For, Show } from 'solid-js';
import { Check, XCircle } from 'lucide-solid';
import { ORDER_STATUS, ORDER_STATUS_META, ORDER_WORKFLOW_STEPS } from '../../constants/config.js';
import { formatDateTime } from '../../utils/formatters.js';

export function OrderLifecycleTracker(props) {
  const isCancelled = () => props.status === ORDER_STATUS.CANCELLED;
  const currentStep = () => ORDER_STATUS_META[props.status]?.stepIndex ?? 0;

  return (
    <div class="w-full">
      <Show
        when={!isCancelled()}
        fallback={
          <div class="flex items-start gap-3 p-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2]">
            <XCircle class="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-semibold text-[#991B1B]">Order Cancelled</p>
              <Show when={props.cancelReason}>
                <p class="text-xs text-[#7F1D1D] mt-0.5">{props.cancelReason}</p>
              </Show>
            </div>
          </div>
        }
      >
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <For each={ORDER_WORKFLOW_STEPS}>
            {(step, idx) => {
              const completed = () => idx() <= currentStep();
              const active = () => idx() === currentStep();
              return (
                <div
                  style={{ '--item-delay': `${idx() * 45}ms` }}
                  class="item-card-reveal flex flex-col gap-1.5"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 tabular-nums transition-all duration-300 ${
                        completed()
                          ? 'bg-[#1D4ED8] text-white'
                          : 'bg-[#EBF1FA] text-[#5A6C8A]'
                      } ${active() ? 'radar-beacon text-[#1D4ED8] ring-4 ring-[#1D4ED8]/20 scale-110' : ''}`}
                    >
                      <span class="relative z-10 text-inherit">
                        {idx() < currentStep() ? (
                          <Check class="w-3.5 h-3.5 text-white" />
                        ) : (
                          <span class={completed() ? 'text-white' : ''}>{idx() + 1}</span>
                        )}
                      </span>
                    </div>
                    <div
                      class={`h-0.5 flex-1 hidden lg:block transition-colors duration-500 ${
                        idx() < currentStep() ? 'bg-[#1D4ED8]' : 'bg-[#DDE6F2]'
                      }`}
                    />
                  </div>
                  <p
                    class={`text-xs font-semibold leading-tight ${
                      completed() ? 'text-[#0D1B3E]' : 'text-[#64748B]'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p class="text-[11px] text-[#5A6C8A]">{step.actor}</p>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      <Show when={props.showTimeline && props.timeline?.length}>
        <div class="mt-5 pt-4 border-t border-[#EBF1FA]">
          <h4 class="text-xs font-semibold text-[#5A6C8A] mb-3">Order Activity Log</h4>
          <ol class="space-y-2">
            <For each={[...props.timeline].reverse()}>
              {(entry, idx) => (
                <li
                  style={{ '--item-delay': `${Math.min(idx(), 6) * 45}ms` }}
                  class="item-card-reveal flex flex-wrap items-baseline justify-between gap-2 text-xs"
                >
                  <span class="text-[#0D1B3E] font-medium">{entry.note}</span>
                  <span class="text-[#5A6C8A] tabular-nums font-mono">
                    {formatDateTime(entry.at)}
                  </span>
                </li>
              )}
            </For>
          </ol>
        </div>
      </Show>
    </div>
  );
}
