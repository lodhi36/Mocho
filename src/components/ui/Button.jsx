import { splitProps } from 'solid-js';

const VARIANTS = {
  primary:
    'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/40 focus-visible:ring-offset-1 border border-transparent',
  secondary:
    'bg-white text-[#0D1B3E] hover:bg-[#EBF1FA] focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/30 border border-[#DDE6F2]',
  subtle:
    'bg-[#EBF1FA] text-[#1E3A8A] hover:bg-[#DCE7F7] focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/30 border border-transparent',
  danger:
    'bg-[#B91C1C] text-white hover:bg-[#991B1B] focus-visible:ring-2 focus-visible:ring-[#B91C1C]/40 border border-transparent',
  success:
    'bg-[#15803D] text-white hover:bg-[#166534] focus-visible:ring-2 focus-visible:ring-[#15803D]/40 border border-transparent',
  ghost:
    'bg-transparent text-[#334669] hover:bg-[#EBF1FA] hover:text-[#0D1B3E] border border-transparent',
};

const SIZES = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
  md: 'min-h-[42px] px-4 py-2 text-sm font-semibold rounded-lg gap-2',
  lg: 'min-h-[48px] px-6 py-2.5 text-sm font-semibold rounded-xl gap-2',
};

export function Button(props) {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'class',
    'loading',
    'disabled',
    'children',
    'type',
  ]);

  const variantClass = () => VARIANTS[local.variant || 'primary'] || VARIANTS.primary;
  const sizeClass = () => SIZES[local.size || 'md'] || SIZES.md;

  return (
    <button
      type={local.type || 'button'}
      disabled={local.disabled || local.loading}
      class={`inline-flex items-center justify-center whitespace-nowrap shrink-0 cursor-pointer transition-all duration-200 active:scale-[0.96] hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClass()} ${sizeClass()} ${local.class || ''}`}
      {...rest}
    >
      {local.loading && (
        <span
          class="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {local.children}
    </button>
  );
}
