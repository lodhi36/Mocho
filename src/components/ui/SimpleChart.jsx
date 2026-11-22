import { For, createMemo } from 'solid-js';

export function BarChart(props) {
  const maxValue = createMemo(() => {
    const vals = (props.data || []).map((d) => Number(d.value) || 0);
    return Math.max(1, ...vals);
  });

  return (
    <div class="item-card-reveal bg-white border border-[#DDE6F2] rounded-xl p-5 shadow-[0_2px_10px_rgba(13,27,62,0.03)]">
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-5">
        <div>
          <h3 class="text-base font-bold text-[#0D1B3E]">{props.title}</h3>
          {props.subtitle && <p class="text-xs text-[#5A6C8A] mt-0.5">{props.subtitle}</p>}
        </div>
        {props.summaryValue && (
          <div class="text-right">
            <span class="text-lg font-bold text-[#0D1B3E] tabular-nums font-display">
              {props.summaryValue}
            </span>
          </div>
        )}
      </div>

      <div class="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-4">
        <For each={props.data || []}>
          {(item, idx) => {
            const pct = () => Math.max(6, Math.round(((Number(item.value) || 0) / maxValue()) * 100));
            return (
              <div class="flex flex-col items-center justify-end h-full gap-2 group">
                <span class="text-[11px] font-medium text-[#4B5C78] group-hover:text-[#0066FF] group-hover:-translate-y-0.5 transition-all tabular-nums">
                  {item.displayValue ?? item.value}
                </span>
                <div class="w-full max-w-[40px] flex-1 flex items-end bg-[#F4F7FC] rounded-t-md overflow-hidden">
                  <div
                    class="bar-grow-up w-full bg-gradient-to-t from-[#1D4ED8] to-[#3B82F6] group-hover:from-[#1E40AF] group-hover:to-[#2563EB] transition-all duration-300 rounded-t-md"
                    style={{
                      height: `${pct()}%`,
                      '--bar-delay': `${idx() * 70}ms`,
                    }}
                  />
                </div>
                <span class="text-xs text-[#5A6C8A] truncate max-w-full">{item.label}</span>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
