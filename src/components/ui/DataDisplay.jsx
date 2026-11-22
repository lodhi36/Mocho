import { Show, createSignal } from 'solid-js';
import { Package } from 'lucide-solid';

export function StatCard(props) {
  return (
    <div
      style={{ '--item-delay': `${props.delay || 0}ms` }}
      class="item-card-reveal group bg-white border border-[#DDE6F2] hover:border-[#93C5FD] rounded-xl p-5 flex flex-col justify-between gap-2 shadow-[0_2px_10px_rgba(13,27,62,0.03)] hover:shadow-[0_10px_22px_rgba(0,102,255,0.09)] transition-all duration-300 hover:-translate-y-1"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-medium text-[#5A6C8A]">{props.label}</span>
        <Show when={props.icon}>
          <span class="text-[#1D4ED8] transition-transform duration-300 group-hover:scale-115">
            {props.icon}
          </span>
        </Show>
      </div>
      <div class="text-2xl font-bold text-[#0D1B3E] tabular-nums tracking-tight font-display">
        {props.value}
      </div>
      <Show when={props.subtext}>
        <p class="text-xs text-[#5A6C8A] tabular-nums">{props.subtext}</p>
      </Show>
    </div>
  );
}

const STATUS_TONES = {
  success: 'text-[#15803D]',
  warning: 'text-[#B45309]',
  danger: 'text-[#B91C1C]',
  info: 'text-[#1D4ED8]',
  neutral: 'text-[#4B5C78]',
};

// Clean unboxed typography for statuses (zero-pill discipline)
export function StatusText(props) {
  const toneClass = () => STATUS_TONES[props.tone || 'neutral'] || STATUS_TONES.neutral;
  return (
    <span class={`inline-flex items-center text-xs font-semibold whitespace-nowrap ${toneClass()}`}>
      {props.label}
    </span>
  );
}

export function EmptyState(props) {
  return (
    <div class="item-card-reveal bg-white border border-[#DDE6F2] rounded-2xl py-12 px-6 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
      <div class="float-gentle w-12 h-12 rounded-2xl bg-[#EBF1FA] text-[#1D4ED8] flex items-center justify-center shadow-2xs">
        {props.icon || <Package class="w-5 h-5" />}
      </div>
      <div class="max-w-md">
        <h3 class="text-base font-bold text-[#0D1B3E]">{props.title}</h3>
        <Show when={props.description}>
          <p class="mt-1 text-sm text-[#5A6C8A]">{props.description}</p>
        </Show>
      </div>
      <Show when={props.action}>
        <div class="mt-2">{props.action}</div>
      </Show>
    </div>
  );
}

export function SkeletonBlock(props) {
  return <div class={`skeleton-shimmer rounded-lg ${props.class || 'h-24 w-full'}`} />;
}

export function ImageWithFallback(props) {
  const [failed, setFailed] = createSignal(false);

  return (
    <Show
      when={props.src && !failed()}
      fallback={
        <div
          class={`bg-gradient-to-br from-[#EBF1FA] to-[#DCE7F7] text-[#1E3A8A] flex flex-col items-center justify-center p-4 text-center ${
            props.class || 'w-full h-full'
          }`}
          role="img"
          aria-label={props.alt || 'Product image'}
        >
          <Package class="w-7 h-7 opacity-60" />
          <span class="mt-1.5 text-xs font-medium line-clamp-1 opacity-80">
            {props.fallbackLabel || props.alt || 'Image'}
          </span>
        </div>
      }
    >
      <img
        src={props.src}
        alt={props.alt || ''}
        referrerPolicy="no-referrer"
        loading={props.loading || 'lazy'}
        onError={() => setFailed(true)}
        class={props.class || 'w-full h-full object-cover'}
      />
    </Show>
  );
}
