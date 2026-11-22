import { Show, splitProps } from 'solid-js';

export function TextField(props) {
  const [local, rest] = splitProps(props, ['label', 'error', 'hint', 'class', 'id']);
  const inputId = local.id || `field-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div class={`flex flex-col gap-1.5 ${local.class || ''}`}>
      <Show when={local.label}>
        <label for={inputId} class="text-sm font-medium text-[#0D1B3E]">
          {local.label}
        </label>
      </Show>
      <input
        id={inputId}
        class={`w-full min-h-[42px] px-3.5 py-2 text-sm bg-white text-[#0D1B3E] placeholder:text-[#7B8CA8] rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25 ${
          local.error
            ? 'border-[#B91C1C] focus:border-[#B91C1C]'
            : 'border-[#CBD8EC] focus:border-[#1D4ED8]'
        }`}
        {...rest}
      />
      <Show when={local.error}>
        <p class="text-xs font-medium text-[#B91C1C]">{local.error}</p>
      </Show>
      <Show when={!local.error && local.hint}>
        <p class="text-xs text-[#5A6C8A]">{local.hint}</p>
      </Show>
    </div>
  );
}

export function SelectField(props) {
  const [local, rest] = splitProps(props, ['label', 'error', 'hint', 'class', 'id', 'children']);
  const selectId = local.id || `select-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div class={`flex flex-col gap-1.5 ${local.class || ''}`}>
      <Show when={local.label}>
        <label for={selectId} class="text-sm font-medium text-[#0D1B3E]">
          {local.label}
        </label>
      </Show>
      <select
        id={selectId}
        class={`w-full min-h-[42px] px-3.5 py-2 text-sm bg-white text-[#0D1B3E] rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25 ${
          local.error
            ? 'border-[#B91C1C] focus:border-[#B91C1C]'
            : 'border-[#CBD8EC] focus:border-[#1D4ED8]'
        }`}
        {...rest}
      >
        {local.children}
      </select>
      <Show when={local.error}>
        <p class="text-xs font-medium text-[#B91C1C]">{local.error}</p>
      </Show>
      <Show when={!local.error && local.hint}>
        <p class="text-xs text-[#5A6C8A]">{local.hint}</p>
      </Show>
    </div>
  );
}

export function TextAreaField(props) {
  const [local, rest] = splitProps(props, ['label', 'error', 'hint', 'class', 'id']);
  const areaId = local.id || `area-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div class={`flex flex-col gap-1.5 ${local.class || ''}`}>
      <Show when={local.label}>
        <label for={areaId} class="text-sm font-medium text-[#0D1B3E]">
          {local.label}
        </label>
      </Show>
      <textarea
        id={areaId}
        class={`w-full px-3.5 py-2.5 text-sm bg-white text-[#0D1B3E] placeholder:text-[#7B8CA8] rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/25 ${
          local.error
            ? 'border-[#B91C1C] focus:border-[#B91C1C]'
            : 'border-[#CBD8EC] focus:border-[#1D4ED8]'
        }`}
        {...rest}
      />
      <Show when={local.error}>
        <p class="text-xs font-medium text-[#B91C1C]">{local.error}</p>
      </Show>
      <Show when={!local.error && local.hint}>
        <p class="text-xs text-[#5A6C8A]">{local.hint}</p>
      </Show>
    </div>
  );
}
